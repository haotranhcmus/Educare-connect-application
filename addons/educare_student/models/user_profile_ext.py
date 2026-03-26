from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class ResUsersEducare(models.Model):
    """
    Extends res.users to expose the Educare role so it can be used as a
    domain filter on Many2one/Many2many fields in educare.student.
    Automatic recompute via @api.depends whenever the linked profile's role changes.
    """
    _inherit = 'res.users'

    educare_profile_ids = fields.One2many(
        'educare.user.profile',
        'user_id',
        string='Educare Profiles',
    )
    educare_role = fields.Selection([
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
    ], compute='_compute_educare_role', store=True, string='Educare Role')

    @api.depends('educare_profile_ids.role')
    def _compute_educare_role(self):
        for user in self:
            profile = user.educare_profile_ids[:1]
            user.educare_role = profile.role if profile else False


class EducareUserProfileExt(models.Model):
    """
    Extends educare.user.profile (from educare_security) to wire
    the bidirectional relationship with educare.student — avoids circular dependency.

    Why placed here:
    - educare_security CANNOT depend on educare_student (student depends on security)
    - So the reverse relation (profile -> students) must be declared from the student module
    """
    _inherit = 'educare.user.profile'

    # ── Override: fix comodel from res.partner (placeholder) to educare.student ──
    student_ids = fields.Many2many(
        'educare.student',
        compute='_compute_student_ids',
        string='Students',
        help='List of students linked to this parent account.',
    )

    # ── Computed Overrides ────────────────────────────────────────────────────

    @api.depends('user_id', 'role')
    def _compute_student_ids(self):
        Student = self.env['educare.student']
        for rec in self:
            if rec.role == 'parent' and rec.user_id:
                rec.student_ids = Student.search([
                    ('parent_user_id', '=', rec.user_id.id),
                ])
            else:
                rec.student_ids = Student

    @api.depends('user_id', 'role')
    def _compute_student_count(self):
        """
        Override placeholder in user_profile.py:
        - Teacher/Supervisor: count active assigned students
        - Other roles: 0
        """
        Student = self.env['educare.student']
        for rec in self:
            if rec.role in ('teacher', 'supervisor') and rec.user_id:
                rec.current_student_count = Student.search_count([
                    ('assigned_teacher_id', '=', rec.user_id.id),
                    ('status', '=', 'active'),
                ])
            else:
                rec.current_student_count = 0

    # ── ORM Overrides ────────────────────────────────────────────────────────

    @api.onchange('role')
    def _onchange_role_check_students(self):
        """
        First protection layer (UI): warn immediately when changing role on the form.

        Why use _origin and direct DB queries:
        - During onchange, self.role is already the new value.
        - Computed fields student_ids/current_student_count depend on role,
          so they are recomputed with the new role and may become empty/0.
        - We must read old_role from self._origin.role and query the DB directly.
        """
        old_role = self._origin.role
        new_role = self.role
        # self._origin.user_id is safer than self.user_id in onchange context
        user = self._origin.user_id
        if not old_role or old_role == new_role or not user:
            return

        uid = user.id
        name = self._origin.display_name or user.name
        Student = self.env['educare.student']
        msgs = []

        # Parent -> another role: direct query because student_ids was recomputed
        if old_role == 'parent' and new_role != 'parent':
            linked = Student.search([('parent_user_id', '=', uid)], limit=4)
            if linked:
                sample = ', '.join(linked.mapped('name')[:3])
                total = Student.search_count([('parent_user_id', '=', uid)])
                extra = _(' and %d more') % (total - 3) if total > 3 else ''
                msgs.append(
                    _('"%s" is currently linked as parent of %d students (%s%s).')
                    % (name, total, sample, extra)
                )

        # Teacher/Supervisor/Admin -> non-staff role
        # Direct query because current_student_count was recomputed to 0
        if old_role in ('teacher', 'supervisor', 'admin') \
                and new_role not in ('teacher', 'admin', 'supervisor'):
            assigned = Student.search_count([
                ('assigned_teacher_id', '=', uid),
                ('status', '=', 'active'),
            ])
            if assigned:
                msgs.append(
                    _('"%s" is currently the main teacher of %d active students.')
                    % (name, assigned)
                )
            co_count = Student.search_count([('co_teacher_ids', 'in', [uid])])
            if co_count:
                msgs.append(
                    _('"%s" is currently co-teacher of %d students.')
                    % (name, co_count)
                )

        # Supervisor/Admin -> no longer supervisor/admin
        if old_role in ('supervisor', 'admin') \
                and new_role not in ('supervisor', 'admin'):
            sup_count = Student.search_count([('supervisor_id', '=', uid)])
            if sup_count:
                msgs.append(
                    _('"%s" is currently supervising %d students.')
                    % (name, sup_count)
                )

        if msgs:
            raise ValidationError(
                _('Cannot change role because student links still exist:\n\n')
                + '\n'.join('• ' + m for m in msgs)
                + _('\n\nPlease remove these links on student records first.')
            )

    def write(self, vals):
        """
        Block role changes that would leave orphaned student links.

        Domain rules in educare.student:
          parent_user_id      → role must be 'parent'
          assigned_teacher_id → role must be in ('teacher', 'admin', 'supervisor')
          co_teacher_ids      → role must be in ('teacher', 'admin', 'supervisor')
          supervisor_id       → role must be in ('supervisor', 'admin')
        """
        if 'role' in vals:
            new_role = vals['role']
            Student = self.env['educare.student']
            errors = []

            for rec in self:
                if not rec.user_id or rec.role == new_role:
                    continue
                uid = rec.user_id.id
                name = rec.display_name

                # parent_user_id: only role 'parent' is valid
                if new_role != 'parent':
                    count = Student.search_count([('parent_user_id', '=', uid)])
                    if count:
                        errors.append(
                            _('• "%s" is parent of %d students. '
                              'Please unlink these student records before changing role.')
                            % (name, count)
                        )

                # assigned_teacher_id + co_teacher_ids: only teacher/admin/supervisor are valid
                if new_role not in ('teacher', 'admin', 'supervisor'):
                    assigned = Student.search_count([('assigned_teacher_id', '=', uid)])
                    if assigned:
                        errors.append(
                            _('• "%s" is main teacher of %d students. '
                              'Please reassign students to another teacher first.')
                            % (name, assigned)
                        )
                    co_taught = Student.search_count([('co_teacher_ids', 'in', [uid])])
                    if co_taught:
                        errors.append(
                            _('• "%s" is co-teacher of %d students. '
                              'Please remove from co-teacher lists first.')
                            % (name, co_taught)
                        )

                # supervisor_id: only supervisor/admin are valid
                if new_role not in ('supervisor', 'admin'):
                    supervised = Student.search_count([('supervisor_id', '=', uid)])
                    if supervised:
                        errors.append(
                            _('• "%s" is supervising %d students. '
                              'Please remove supervision assignments first.')
                            % (name, supervised)
                        )

            if errors:
                raise ValidationError(
                    _('Cannot change role because linked student data still exists:\n\n')
                    + '\n'.join(errors)
                )

        return super().write(vals)
