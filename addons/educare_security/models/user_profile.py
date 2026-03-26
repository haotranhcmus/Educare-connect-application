from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class EducareUserProfile(models.Model):
    _name = 'educare.user.profile'
    _description = 'Educare User Profile'
    _inherit = ['mail.thread', 'mail.activity.mixin', 'educare.audit.mixin']
    _rec_name = 'display_name'

    # Group 1: User Link
    user_id = fields.Many2one(
        'res.users',
        string='User',
        ondelete='cascade',
        index=True,
    )
    # Used when creating a new profile without user_id; auto-creates res.users.
    full_name = fields.Char(
        string='Full Name',
        help='Enter user full name. The system will auto-create the account on save.',
    )
    login = fields.Char(
        string='Login (Email)',
        help='Enter email/login for the new account.',
    )
    display_name = fields.Char(
        string='Display Name',
        compute='_compute_display_name',
        store=True,
    )
    email = fields.Char(
        string='Email',
        related='user_id.email',
        readonly=True,
    )
    phone = fields.Char(string='Phone', size=20)
    avatar = fields.Binary(
        string='Avatar',
        related='user_id.image_128',
    )

    # Group 2: Role and Organization
    role = fields.Selection([
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
    ], string='Role', tracking=True, required=True, default='teacher')

    center_id = fields.Many2one(
        'educare.center',
        string='Center',
        ondelete='set null',
        tracking=True,
    )
    job_title = fields.Char(string='Job Title', size=128)
    department = fields.Char(string='Department', size=128)
    employee_code = fields.Char(string='Employee Code', size=20, index=True, copy=False)

    # Group 3: Status and Security
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ], string='Status', default='active', tracking=True)

    date_joined = fields.Date(
        string='Date Joined',
        default=fields.Date.today,   # reference, do not call the function here
    )
    last_login = fields.Datetime(string='Last Login', readonly=True)
    login_count = fields.Integer(string='Login Count', default=0, readonly=True)
    failed_login_count = fields.Integer(
        string='Failed Login Count', default=0, readonly=True
    )
    last_failed_login = fields.Datetime(
        string='Last Failed Login', readonly=True
    )
    account_locked = fields.Boolean(
        string='Account Locked', default=False, tracking=True
    )
    lock_reason = fields.Char(string='Lock Reason', size=256)
    two_factor_enabled = fields.Boolean(
        string='Two-Factor Auth', default=False
    )

    # Group 4: Expertise (Teacher/Supervisor)
    specialization = fields.Text(string='Specialization')
    certification = fields.Char(
        string='Certifications (BCBA, RBT, etc.)', size=256
    )
    years_experience = fields.Integer(string='Years of Experience')
    bio = fields.Text(string='Biography')
    max_students = fields.Integer(
        string='Max Students Capacity', default=8
    )
    current_student_count = fields.Integer(
        string='Current Student Count',
        compute='_compute_student_count',
    )

    # Group 5: Parent Role
    parent_relation = fields.Selection([
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Guardian'),
        ('other', 'Other'),
    ], string='Relationship')

    student_ids = fields.Many2many(
        'res.partner',
        string='Students',
        compute='_compute_student_ids',
    )
    preferred_contact = fields.Selection([
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('zalo', 'Zalo'),
        ('sms', 'SMS'),
    ], string='Preferred Contact')
    receive_notifications = fields.Boolean(
        string='Receive Notifications', default=True
    )

    # ── Python Constraints ──────────────────────────────────────────────────
    @api.constrains('role', 'center_id')
    def _check_center_required(self):
        for rec in self:
            if rec.role in ('teacher', 'supervisor') and not rec.center_id:
                raise ValidationError(
                    _('Teachers and supervisors must be assigned to a center.')
                )

    # ── SQL Constraints ───────────────────────────────────────────────────────
    _sql_constraints = [
        ('unique_user', 'UNIQUE(user_id)',
         'Each user can only have one profile!'),
        ('unique_employee_code', 'UNIQUE(employee_code)',
         'Employee code must be unique!'),
    ]

    # ── Computed Methods ──────────────────────────────────────────────────────
    @api.depends('user_id', 'user_id.name', 'role', 'full_name')
    def _compute_display_name(self):
        for rec in self:
            role_label = dict(
                rec._fields['role'].selection
            ).get(rec.role, '')
            name = rec.user_id.name if rec.user_id else (rec.full_name or '')
            if name and role_label:
                rec.display_name = f"{name} ({role_label})"
            else:
                rec.display_name = name or ''

    def _compute_student_count(self):
        # Placeholder, will be wired when educare_student is ready.
        for rec in self:
            rec.current_student_count = 0

    def _compute_student_ids(self):
        # Placeholder — will be wired when educare_student is ready
        for rec in self:
            rec.student_ids = self.env['res.partner']

    # ── Action Methods ────────────────────────────────────────────────────────
    def _sync_security_group(self):
        """Automatically sync Odoo security groups based on role (internal use)."""
        group_map = {
            'admin': self.env.ref('educare_security.group_admin'),
            'supervisor': self.env.ref('educare_security.group_supervisor'),
            'teacher': self.env.ref('educare_security.group_teacher'),
            'parent': self.env.ref('educare_security.group_parent'),
        }
        all_groups = sum(
            group_map.values(),
            self.env['res.groups']
        )
        for rec in self:
            if rec.role and rec.user_id:
                rec.user_id.groups_id -= all_groups
                rec.user_id.groups_id += group_map[rec.role]

    def _assign_created_supervisor_to_student(self):
        student_id = self.env.context.get('from_student_id')
        if not student_id:
            return

        student = self.env['educare.student'].browse(student_id)
        if not student.exists():
            return

        for rec in self:
            if rec.role != 'supervisor' or not rec.user_id:
                continue
            student.write({'supervisor_id': rec.user_id.id})
            break

    def _normalize_security_status_vals(self, vals, current_status=None):
        vals = dict(vals)
        if vals.get('account_locked') is True:
            vals['status'] = 'suspended'
        elif vals.get('account_locked') is False:
            if vals.get('status') == 'suspended' or current_status == 'suspended':
                vals.setdefault('status', 'active')

        if vals.get('status') == 'suspended':
            vals['account_locked'] = True
        elif vals.get('status') == 'active':
            vals.setdefault('account_locked', False)

        return vals

    # ── ORM Overrides ─────────────────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        if self.env.context.get('force_supervisor_role'):
            for vals in vals_list:
                vals['role'] = 'supervisor'

        normalized_vals_list = []
        for vals in vals_list:
            vals = self._normalize_security_status_vals(vals)
            if not vals.get('user_id'):
                full_name = (vals.get('full_name') or '').strip()
                login = (vals.get('login') or '').strip()
                if not full_name:
                    raise UserError(_('Please enter Full Name to create a user account.'))
                if not login:
                    raise UserError(_('Please enter Login (Email) to create a user account.'))
                # Ensure login is unique
                if self.env['res.users'].sudo().search([('login', '=', login)], limit=1):
                    raise UserError(_('Login "%s" already exists. Please use another email.') % login)
                new_user = self.env['res.users'].sudo().with_context(
                    no_reset_password=True
                ).create({
                    'name': full_name,
                    'login': login,
                    'email': login,
                })
                vals['user_id'] = new_user.id
            # Auto-generate employee_code for teacher / supervisor
            if vals.get('role') in ('teacher', 'supervisor'):
                if not vals.get('employee_code'):
                    vals['employee_code'] = (
                        self.env['ir.sequence'].next_by_code('educare.employee.code') or '/'
                    )
            normalized_vals_list.append(vals)
        records = super().create(normalized_vals_list)
        if not self._context.get('skip_group_sync'):
            records.filtered('role')._sync_security_group()
        records._sync_user_active_state()
        records._assign_created_supervisor_to_student()
        return records

    def write(self, vals):
        if len(self) == 1:
            vals = self._normalize_security_status_vals(vals, current_status=self.status)
        if self.env.context.get('force_supervisor_role'):
            if 'role' in vals and vals['role'] != 'supervisor':
                raise UserError(_('Role is locked to Supervisor in this flow.'))
            vals = dict(vals)
            vals['role'] = 'supervisor'

        res = super().write(vals)
        if 'role' in vals:
            self._sync_security_group()
        if 'account_locked' in vals or 'status' in vals:
            self._sync_user_active_state()
        return res

    def _sync_user_active_state(self):
        """Sync res.users.active based on account_locked and profile status.
        Locked OR suspended/inactive → user cannot login (active=False).
        """
        for rec in self:
            if not rec.user_id:
                continue
            should_be_active = (
                not rec.account_locked
                and rec.status == 'active'
            )
            if rec.user_id.active != should_be_active:
                rec.user_id.sudo().write({'active': should_be_active})

    @api.onchange('account_locked')
    def _onchange_account_locked(self):
        if self.account_locked:
            self.status = 'suspended'
        elif self.status == 'suspended':
            self.status = 'active'

    @api.onchange('status')
    def _onchange_status(self):
        if self.status == 'suspended':
            self.account_locked = True
        elif self.status == 'active':
            self.account_locked = False

    @api.constrains('role', 'employee_code')
    def _check_employee_code_required(self):
        for rec in self:
            if rec.role in ('teacher', 'supervisor') and not rec.employee_code:
                raise ValidationError(
                    _('Teacher and Supervisor must have an Employee Code.')
                )

    @api.model
    def action_open_my_profile(self):
        """Open the current user's profile, auto-creating one if it doesn't exist."""
        user = self.env.user
        profile = self.sudo().search([('user_id', '=', user.id)], limit=1)
        if not profile:
            # Determine role from res.users groups (don't rely on profile existing)
            if user.has_group('educare_security.group_admin'):
                role = 'admin'
            elif user.has_group('educare_security.group_supervisor'):
                role = 'supervisor'
            elif user.has_group('educare_security.group_teacher'):
                role = 'teacher'
            else:
                role = 'parent'
            # Use sudo() so even read-only users can initialise their own profile.
            # skip_group_sync=True: user already has correct groups, no need to
            # remove-then-re-add them (which temporarily breaks the security cache).
            vals = {
                'user_id': user.id,
                'role': role,
                'status': 'active',
            }
            profile = self.sudo().with_context(skip_group_sync=True).create(vals)
        view_id = self.env.ref(
            'educare_security.educare_user_profile_my_profile_form'
        ).id
        return {
            'type': 'ir.actions.act_window',
            'name': _('My Profile'),
            'res_model': 'educare.user.profile',
            'view_mode': 'form',
            'res_id': profile.id,
            'view_id': view_id,
            'target': 'current',
        }
    

class ResUsers(models.Model):
    _inherit = 'res.users'

    educare_profile_ids = fields.One2many(
        'educare.user.profile',
        'user_id',
        string='Educare Profiles',
    )