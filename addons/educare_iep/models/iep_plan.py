from datetime import timedelta
from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


PLAN_STATUS = [
    ('draft', 'Draft'),
    ('ready_review', 'Ready for Review'),
    ('supervisor_approved', 'Supervisor Approved'),
    ('active', 'Active'),
    ('closed', 'Closed'),
]

REVIEW_FREQUENCIES = [
    ('weekly', 'Weekly'),
    ('biweekly', 'Biweekly'),
    ('monthly', 'Monthly'),
    ('quarterly', 'Quarterly'),
]

ALLOWED_STATUS_TRANSITIONS = {
    'draft': {'draft', 'ready_review'},
    'ready_review': {'ready_review', 'draft', 'supervisor_approved'},
    'supervisor_approved': {'supervisor_approved', 'active'},
    'active': {'active', 'closed'},
    'closed': {'closed'},
}


class EducareIepPlan(models.Model):
    _name = 'educare.iep.plan'
    _description = 'IEP Plan'
    _rec_name = 'iep_period'
    _order = 'start_date desc, id desc'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        required=True,
        ondelete='cascade',
        tracking=True,
        index=True,
    )
    student_center_id = fields.Many2one(
        'educare.center',
        string='Student Center',
        related='student_id.center_id',
        readonly=True,
    )
    assigned_teacher_id = fields.Many2one(
        'res.users',
        string='Assigned Teacher',
        ondelete='restrict',
        tracking=True,
        index=True,
        domain="[('educare_role', '=', 'teacher'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    iep_period = fields.Char(
        string='IEP Period',
        required=True,
        size=32,
        tracking=True,
        help='Example: 2026-H1, 2026-Term1',
        compute='_compute_iep_period',
        store=True,
        readonly=True,
        precompute=True,
    )
    start_date = fields.Date(
        string='Start Date',
        required=True,
        tracking=True,
        default=fields.Date.context_today,
    )
    end_date = fields.Date(
        string='End Date',
        required=True,
        tracking=True,
    )
    supervisor_id = fields.Many2one(
        'res.users',
        string='Supervisor',
        ondelete='set null',
        tracking=True,
        domain="[('educare_role', '=', 'supervisor'), ('educare_profile_ids.center_id', '=', student_center_id)]",
    )
    revision_of_id = fields.Many2one(
        'educare.iep.plan',
        string='Revision Of',
        ondelete='set null',
        copy=False,
        readonly=True,
        index=True,
    )
    root_plan_id = fields.Many2one(
        'educare.iep.plan',
        string='Version Root',
        ondelete='restrict',
        copy=False,
        readonly=True,
        index=True,
    )
    revision_ids = fields.One2many(
        'educare.iep.plan',
        'revision_of_id',
        string='Revisions',
    )
    version_number = fields.Integer(
        string='Version',
        default=1,
        required=True,
        copy=False,
        readonly=True,
        index=True,
    )
    is_latest_version = fields.Boolean(
        string='Latest Version',
        default=True,
        copy=False,
        readonly=True,
        index=True,
    )
    supervisor_approved = fields.Boolean(
        string='Supervisor Approved',
        default=False,
        tracking=True,
    )
    approved_date = fields.Date(string='Approved Date')
    approval_notes = fields.Text(string='Approval Notes')
    parent_consent = fields.Boolean(
        string='Parent Consent',
        default=False,
        tracking=True,
    )
    parent_consent_date = fields.Date(string='Parent Consent Date')
    status = fields.Selection(
        selection=PLAN_STATUS,
        string='Status',
        default='draft',
        required=True,
        tracking=True,
        index=True,
    )
    review_frequency = fields.Selection(
        selection=REVIEW_FREQUENCIES,
        string='Review Frequency',
        required=True,
        default='monthly',
        tracking=True,
    )
    next_review_date = fields.Date(
        string='Next Review Date',
        compute='_compute_next_review_date',
        store=True,
        help='Overall review date for this IEP plan.',
        tracking=True,
    )
    closing_reason = fields.Selection(
        selection=[
            ('completed_period', 'Completed period'),
            ('student_transferred', 'Student transferred'),
            ('plan_revised', 'Plan revised'),
            ('other', 'Other'),
        ],
        string='Closing Reason',
        tracking=True,
    )
    closing_notes = fields.Text(
        string='Closing Notes',
        tracking=True,
        help='Additional notes or audit trail for why the plan was closed.',
    )
    revision_reason = fields.Selection(
        selection=[
            ('periodic_review', 'Periodic review update'),
            ('goal_adjustment', 'Goal adjustment'),
            ('strategy_change', 'Intervention strategy change'),
            ('student_change', 'Student profile/need change'),
            ('other', 'Other'),
        ],
        string='Revision Reason',
        tracking=True,
        copy=False,
    )
    revision_notes = fields.Text(
        string='Revision Notes',
        tracking=True,
        copy=False,
    )

    goal_ids = fields.One2many(
        'educare.iep.goal',
        'plan_id',
        string='Long-term Goals',
    )
    goal_count = fields.Integer(
        string='Goal Count',
        compute='_compute_goal_count',
        store=False,
    )

    _sql_constraints = [
        (
            'plan_dates_check',
            'CHECK(end_date > start_date)',
            'End date must be after start date.',
        ),
        (
            'root_version_unique',
            'UNIQUE(root_plan_id, version_number)',
            'Version number must be unique in a revision chain.',
        ),
    ]

    @api.depends('student_id.name', 'iep_period', 'version_number')
    def _compute_display_name(self):
        for plan in self:
            student = plan.student_id.name or ''
            period = plan.iep_period or ''
            version = plan.version_number or 1
            label = f"{period} v{version}" if period else f"v{version}"
            plan.display_name = f"{student} - {label}" if student else label

    @api.depends('start_date')
    def _compute_iep_period(self):
        for rec in self:
            base_date = rec.start_date or fields.Date.context_today(rec)
            year = base_date.year
            month = base_date.month
            half = 'H1' if month <= 6 else 'H2'
            rec.iep_period = f"{year}-{half}"

    @api.constrains('status', 'root_plan_id')
    def _check_single_active_version(self):
        for plan in self:
            if plan.status != 'active':
                continue
            root = plan.root_plan_id or plan
            active_versions = self.search_count([
                ('id', '!=', plan.id),
                ('root_plan_id', '=', root.id),
                ('status', '=', 'active'),
            ])
            if active_versions:
                raise ValidationError(
                    _('Only one version can be Active in the same IEP revision chain.')
                )

    @api.constrains('status', 'supervisor_approved', 'parent_consent', 'goal_ids')
    def _check_plan_active_gate(self):
        for plan in self:
            if plan.status != 'active':
                continue
            if not plan.supervisor_approved:
                raise ValidationError(
                    _('A plan can move to Active only after supervisor approval.')
                )
            if not plan.parent_consent:
                raise ValidationError(
                    _('A plan can move to Active only after parent consent.')
                )
            if not plan.goal_ids:
                raise ValidationError(
                    _('A plan can move to Active only when it has at least one long-term goal.')
                )

    def _compute_goal_count(self):
        for plan in self:
            plan.goal_count = len(plan.goal_ids)

    @api.depends('start_date', 'review_frequency')
    def _compute_next_review_date(self):
        frequency_days = {
            'weekly': 7,
            'biweekly': 14,
            'monthly': 30,
            'quarterly': 90,
        }
        for plan in self:
            if plan.start_date and plan.review_frequency:
                plan.next_review_date = plan.start_date + timedelta(
                    days=frequency_days.get(plan.review_frequency, 30)
                )
            else:
                plan.next_review_date = False

    def _sync_goal_statuses(self):
        for plan in self:
            plan.goal_ids._auto_update_status_from_workflow()

    def _ensure_root_link(self):
        rootless = self.filtered(lambda p: not p.root_plan_id)
        if rootless:
            for plan in rootless:
                plan.with_context(skip_auto_status_flow=True).write({'root_plan_id': plan.id})

    def _sync_latest_version_flag(self):
        roots = (self.mapped('root_plan_id') | self.filtered(lambda p: p.root_plan_id == p)).exists()
        if not roots:
            return
        for root in roots:
            chain = self.search([
                ('root_plan_id', '=', root.id),
            ], order='version_number desc, id desc')
            latest = chain[:1]
            (chain - latest).with_context(skip_auto_status_flow=True).write({'is_latest_version': False})
            latest.with_context(skip_auto_status_flow=True).write({'is_latest_version': True})

    def action_open_goals(self):
        self.ensure_one()
        action = self.env.ref('educare_iep.action_educare_iep_goal').sudo().read()[0]
        action['domain'] = [('plan_id', '=', self.id)]
        action['context'] = {
            'default_plan_id': self.id,
            'search_default_filter_active_plan': 0,
        }
        return action

    def action_open_goal_wizard(self):
        self.ensure_one()
        if self.status != 'draft':
            raise ValidationError(
                _('New goals can only be added while plan is Draft. Use Revise for Active/Closed plans.')
            )
        action = self.env.ref('educare_iep.action_educare_goal_quick_wizard').sudo().read()[0]
        action['context'] = {
            'default_plan_id': self.id,
        }
        return action

    def action_view_versions(self):
        self.ensure_one()
        self._ensure_root_link()
        root = self.root_plan_id or self
        action = self.env.ref('educare_iep.action_educare_iep_plan').sudo().read()[0]
        action['name'] = _('IEP Plan Versions')
        action['domain'] = [('root_plan_id', '=', root.id)]
        action['context'] = {
            'default_student_id': self.student_id.id,
            'search_default_filter_latest_version': 0,
        }
        return action

    def action_supervisor_approve(self):
        self.ensure_one()
        if self.status != 'ready_review':
            raise ValidationError(
                _('Plan must be in Ready for Review before supervisor approval.')
            )
        if not self.supervisor_id:
            raise ValidationError(
                _('Please assign a supervisor before approving.')
            )
        is_admin = self.env.user.has_group('educare_security.group_admin')
        if not is_admin and self.env.user != self.supervisor_id:
            raise ValidationError(
                _('Only the selected supervisor can approve this IEP plan.')
            )
        if not self.goal_ids:
            raise ValidationError(
                _('Plan must have at least one goal before approval.')
            )
        self.write({
            'supervisor_approved': True,
            'approved_date': fields.Date.today(),
            'status': 'supervisor_approved',
        })
        self.message_post(
            body=_('Plan approved by supervisor %s.', self.supervisor_id.name),
            message_type='comment',
            subtype_xmlid='mail.mt_note',
        )

    def action_parent_consent(self):
        self.ensure_one()
        if self.status != 'supervisor_approved':
            raise ValidationError(
                _('Plan must be supervisor approved before parent consent.')
            )
        if not self.supervisor_approved:
            raise ValidationError(
                _('Supervisor approval is required before parent consent.')
            )
        if not self.goal_ids:
            raise ValidationError(
                _('Plan must have at least one goal before parent consent.')
            )
        plan_sudo = self.sudo()
        plan_sudo._close_other_active_versions()
        plan_sudo.write({
            'parent_consent': True,
            'parent_consent_date': fields.Date.today(),
            'status': 'active',
        })
        plan_sudo.message_post(
            body=_('Parent consent received. Plan is now Active.'),
            message_type='comment',
            subtype_xmlid='mail.mt_note',
        )

    def _close_other_active_versions(self):
        for plan in self:
            root = plan.root_plan_id or plan
            other_active = self.search([
                ('id', '!=', plan.id),
                ('root_plan_id', '=', root.id),
                ('status', '=', 'active'),
            ])
            if other_active:
                other_active.with_context(
                    skip_auto_status_flow=True,
                    skip_status_transition_check=True,
                ).write({
                    'status': 'closed',
                    'closing_reason': 'plan_revised',
                })
                for old_plan in other_active:
                    old_plan.message_post(
                        body=_('Plan auto-closed: replaced by new version.'),
                        message_type='comment',
                        subtype_xmlid='mail.mt_note',
                    )

    def _auto_move_to_ready_review_if_ready(self):
        """Only handle backward transition: ready_review → draft when all goals are removed."""
        for plan in self:
            if (
                plan.status == 'ready_review'
                and not bool(plan.goal_ids)
            ):
                plan.with_context(skip_auto_status_flow=True).write({'status': 'draft'})

    def action_reset_to_draft(self):
        """Teacher withdraws a Ready for Review plan back to Draft."""
        self.ensure_one()
        if self.status != 'ready_review':
            raise ValidationError(
                _('Only plans in Ready for Review can be reset to Draft.')
            )
        self.with_context(
            skip_status_transition_check=True,
            skip_auto_status_flow=True,
        ).write({'status': 'draft'})
        self.message_post(
            body=_('Plan withdrawn from review and reset to Draft.'),
            message_type='comment',
            subtype_xmlid='mail.mt_note',
        )

    def action_submit_for_review(self):
        self.ensure_one()
        if self.status != 'draft':
            raise ValidationError(
                _('Only Draft plans can be submitted for review.')
            )
        if not self.supervisor_id:
            raise ValidationError(
                _('Please assign a supervisor before submitting for review.')
            )
        if not self.goal_ids:
            raise ValidationError(
                _('Plan must have at least one goal before submitting for review.')
            )
        goals_without_objectives = self.goal_ids.filtered(lambda g: not g.objective_ids)
        if goals_without_objectives:
            raise ValidationError(
                _('All goals must have at least one objective before submitting. '
                  'Goals missing objectives: %s',
                  ', '.join(goals_without_objectives.mapped('name')))
            )
        self.with_context(skip_auto_status_flow=True).write({'status': 'ready_review'})
        self.message_post(
            body=_('Plan submitted for supervisor review.'),
            message_type='comment',
            subtype_xmlid='mail.mt_note',
        )

    def action_close(self, closing_reason=False, closing_notes=False):
        """Close plan from wizard with explicit reason/notes.

        Kept as a server-side action so that future flows (e.g. API)
        can reuse the same behavior instead of writing status directly.
        """
        for plan in self:
            if plan.status != 'active':
                raise ValidationError(
                    _('Only Active plans can be closed.')
                )

        values = {'status': 'closed'}
        if closing_reason:
            values['closing_reason'] = closing_reason
        if closing_notes is not False:
            values['closing_notes'] = closing_notes

        # Skip transition guard because wizard already enforces flow.
        return self.with_context(skip_status_transition_check=True).write(values)

    def action_open_close_wizard(self):
        """Open Close IEP Plan wizard instead of inline scrolling."""
        self.ensure_one()
        if self.status != 'active':
            raise ValidationError(
                _('Only Active plans can be closed.')
            )
        action = self.env.ref('educare_iep.action_educare_iep_plan_close_wizard').sudo().read()[0]
        action['context'] = {
            'default_plan_id': self.id,
            'default_closing_reason': self.closing_reason or False,
            'default_closing_notes': self.closing_notes or '',
        }
        return action

    def _move_goals_to_revision(self, revision):
        """Move goals and objectives to the revision plan, preserving all session tracking data.

        Instead of copying records (which creates new IDs that break session_result FK links),
        we reassign plan_id on existing goal records. All session_result records remain linked
        via the same objective IDs so that current_accuracy_pct, progress_pct, consecutive,
        and trend all continue from real measurement history — progress is NOT reset to zero.

        The original plan has its goals removed and is closed immediately as superseded.
        During the revision draft period teachers can edit goal info and objective parameters
        (baseline, target accuracy, consecutive sessions required, weight, etc.).
        Objectives with session tracking data cannot be deleted — use Discontinue instead.
        """
        self.ensure_one()
        for goal in self.goal_ids:
            # Pass start_date explicitly to prevent goal.write() from overwriting it
            # with the new revision plan's start_date (goals retain their original start_date).
            goal.with_context(skip_auto_goal_status_sync=True).write({
                'plan_id': revision.id,
                'start_date': goal.start_date,
            })

    def action_create_revision(self, revision_reason=False, revision_notes=False):
        self.ensure_one()
        if self.status not in ('active', 'closed'):
            raise ValidationError(
                _('Revision is allowed only when plan status is Active or Closed.')
            )
        if not revision_reason:
            raise ValidationError(
                _('Revision Reason is required before creating a new revision.')
            )

        self._ensure_root_link()

        root = self.root_plan_id or self
        latest = self.search([
            ('root_plan_id', '=', root.id),
        ], order='version_number desc', limit=1)
        next_version = (latest.version_number or 1) + 1

        revision = self.copy({
            'revision_of_id': self.id,
            'root_plan_id': root.id,
            'version_number': next_version,
            'status': 'draft',
            'supervisor_approved': False,
            'approved_date': False,
            'parent_consent': False,
            'parent_consent_date': False,
            'revision_reason': revision_reason,
            'revision_notes': revision_notes or False,
            'goal_ids': [(5, 0, 0)],
        })

        # Move goals (and their objectives) to the revision plan instead of copying.
        # This preserves all session tracking data via unchanged record IDs.
        self._move_goals_to_revision(revision)

        # Close the current plan immediately — it is superseded by this revision.
        # Goals have been moved, so the original plan now serves as a metadata record only.
        if self.status == 'active':
            self.with_context(
                skip_auto_status_flow=True,
                skip_status_transition_check=True,
            ).write({
                'status': 'closed',
                'closing_reason': 'plan_revised',
                'closing_notes': _('Superseded by revision v%s.', next_version),
            })
            self.message_post(
                body=_('Plan superseded — goals moved to revision v%s.', next_version),
                message_type='comment',
                subtype_xmlid='mail.mt_note',
            )

        (self | revision)._sync_latest_version_flag()

        return {
            'type': 'ir.actions.act_window',
            'name': _('IEP Plan Revision'),
            'res_model': 'educare.iep.plan',
            'res_id': revision.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def action_open_revision_wizard(self):
        self.ensure_one()
        if self.status not in ('active', 'closed'):
            raise ValidationError(
                _('Revision is allowed only when plan status is Active or Closed.')
            )
        action = self.env.ref('educare_iep.action_educare_iep_plan_revision_wizard').sudo().read()[0]
        action['context'] = {
            'default_plan_id': self.id,
        }
        return action

    def action_open_reject_wizard(self):
        self.ensure_one()
        if self.status != 'ready_review':
            raise ValidationError(
                _('Only plans in Ready for Review can be rejected.')
            )
        action = self.env.ref('educare_iep.action_educare_iep_plan_reject_wizard').sudo().read()[0]
        action['context'] = {
            'default_plan_id': self.id,
        }
        return action

    @api.onchange('student_id')
    def _onchange_student_id(self):
        for plan in self:
            if not plan.student_id:
                continue
            plan.assigned_teacher_id = plan.student_id.assigned_teacher_id
            if plan.student_id.supervisor_id:
                plan.supervisor_id = plan.student_id.supervisor_id

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            student = self.env['educare.student'].browse(vals.get('student_id'))
            if not student.exists():
                continue
            if not vals.get('assigned_teacher_id') and student.assigned_teacher_id:
                vals['assigned_teacher_id'] = student.assigned_teacher_id.id
            if not vals.get('supervisor_id') and student.supervisor_id:
                vals['supervisor_id'] = student.supervisor_id.id
            if vals.get('revision_of_id'):
                revision_of = self.browse(vals['revision_of_id'])
                root = revision_of.root_plan_id or revision_of
                vals.setdefault('root_plan_id', root.id)
                if not vals.get('version_number'):
                    latest = self.search([
                        ('root_plan_id', '=', root.id),
                    ], order='version_number desc', limit=1)
                    vals['version_number'] = (latest.version_number or revision_of.version_number or 1) + 1
            else:
                vals.setdefault('version_number', 1)
        plans = super().create(vals_list)
        plans._ensure_root_link()
        plans._sync_latest_version_flag()
        return plans

    def write(self, vals):
        vals = dict(vals)
        today = fields.Date.today()

        if 'status' in vals and not self.env.context.get('skip_status_transition_check'):
            target_status = vals['status']
            for plan in self:
                current_status = plan.status
                allowed_targets = ALLOWED_STATUS_TRANSITIONS.get(current_status, {current_status})
                if target_status not in allowed_targets:
                    raise ValidationError(
                        _('Invalid status transition: %(current)s -> %(target)s. Use workflow actions (Approve, Parent Consent, Close, Revise).',
                          current=current_status,
                          target=target_status)
                    )

        if 'supervisor_approved' in vals:
            vals.setdefault('approved_date', today if vals['supervisor_approved'] else False)
        if 'parent_consent' in vals:
            vals.setdefault('parent_consent_date', today if vals['parent_consent'] else False)

        result = super().write(vals)
        if {'status', 'goal_ids', 'supervisor_approved', 'parent_consent'}.intersection(vals):
            self._sync_goal_statuses()
        if {'root_plan_id', 'version_number'}.intersection(vals):
            self._sync_latest_version_flag()
        if not self.env.context.get('skip_auto_status_flow'):
            self._auto_move_to_ready_review_if_ready()
        return result
