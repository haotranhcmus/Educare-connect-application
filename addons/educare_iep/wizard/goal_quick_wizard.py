from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class EducareIepGoalWizard(models.TransientModel):
    _name = 'educare.iep.goal.wizard'
    _description = 'IEP Goal Quick Create Wizard'

    # ── Context fields (readonly, from plan) ──────────────────────
    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='IEP Plan',
        required=True,
        ondelete='cascade',
    )
    student_id = fields.Many2one(
        'educare.student',
        string='Student',
        related='plan_id.student_id',
        readonly=True,
    )
    assigned_teacher_id = fields.Many2one(
        'res.users',
        string='Assigned Teacher',
        related='plan_id.assigned_teacher_id',
        readonly=True,
    )
    supervisor_id = fields.Many2one(
        'res.users',
        string='Supervisor',
        related='plan_id.supervisor_id',
        readonly=True,
    )

    # ── Goal editable fields ─────────────────────────────────────
    name = fields.Char(string='Goal Name', required=True)
    goal_domain_id = fields.Many2one(
        'educare.domain',
        string='Development Domain',
        required=True,
    )
    target_date = fields.Date(string='Target Date', required=True)
    goal_description = fields.Text(
        string='Overall Goal Description',
        required=True,
    )

    # ── Objective lines (inline tree) ────────────────────────────
    objective_line_ids = fields.One2many(
        'educare.iep.goal.wizard.line',
        'wizard_id',
        string='Short-term Objectives',
    )
    objective_count = fields.Integer(
        string='Objective Count',
        compute='_compute_objective_count',
    )

    def _compute_objective_count(self):
        for wizard in self:
            wizard.objective_count = len(wizard.objective_line_ids)

    # ── Actions ──────────────────────────────────────────────────
    def action_create_goal(self):
        """Validate and create goal + objectives in one shot."""
        self.ensure_one()
        if not self.objective_line_ids:
            raise ValidationError(
                _('Vui lòng thêm ít nhất 1 mục tiêu ngắn hạn trước khi tạo Goal.')
            )

        goal = self.env['educare.iep.goal'].create({
            'plan_id': self.plan_id.id,
            'name': self.name,
            'goal_domain_id': self.goal_domain_id.id,
            'target_date': self.target_date,
            'goal_description': self.goal_description,
        })

        objective_model = self.env['educare.iep.objective']
        for line in self.objective_line_ids.sorted('sequence'):
            objective_model.create({
                'goal_id': goal.id,
                'sequence': line.sequence,
                'name': line.name,
                'description': (line.description or line.name or '').strip(),
                'baseline_accuracy_pct': line.baseline_accuracy_pct,
                'target_accuracy_pct': line.target_accuracy_pct,
                'weight': line.weight,
                'consecutive_sessions_required': line.consecutive_sessions_required,
                'measurement_method': line.measurement_method,
                'status': 'not_started',
            })

        return {
            'type': 'ir.actions.act_window',
            'name': _('Long-term Goal'),
            'res_model': 'educare.iep.goal',
            'res_id': goal.id,
            'view_mode': 'form',
            'target': 'current',
        }


class EducareIepGoalWizardLine(models.TransientModel):
    _name = 'educare.iep.goal.wizard.line'
    _description = 'IEP Goal Wizard Objective Line'
    _order = 'sequence, id'

    wizard_id = fields.Many2one(
        'educare.iep.goal.wizard',
        required=True,
        ondelete='cascade',
    )
    sequence = fields.Integer(default=10)
    name = fields.Char(string='Objective Name', required=True)
    description = fields.Text(string='Description')
    baseline_accuracy_pct = fields.Float(
        string='Baseline Accuracy (%)',
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string='Target Accuracy (%)',
        default=80.0,
    )
    weight = fields.Float(string='Weight', default=1.0)
    consecutive_sessions_required = fields.Integer(
        string='Consecutive Sessions Required',
        default=3,
    )
    measurement_method = fields.Text(
        string='Measurement Method',
        default='Quan sát trực tiếp trong buổi học.',
        required=True,
    )

    @api.constrains('baseline_accuracy_pct', 'target_accuracy_pct')
    def _check_accuracy_values(self):
        for line in self:
            if line.baseline_accuracy_pct < 0 or line.baseline_accuracy_pct > 100:
                raise ValidationError(
                    _('Baseline accuracy must be between 0 and 100 for objective "%s".') % line.name
                )
            if line.target_accuracy_pct < 0 or line.target_accuracy_pct > 100:
                raise ValidationError(
                    _('Target accuracy must be between 0 and 100 for objective "%s".') % line.name
                )
            if line.target_accuracy_pct <= line.baseline_accuracy_pct:
                raise ValidationError(
                    _('Target accuracy must be greater than baseline accuracy for objective "%s".') % line.name
                )
