from odoo import _, api, fields, models


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
    priority = fields.Selection(
        selection=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        string='Priority',
        default='medium',
    )
    goal_description = fields.Text(
        string='Overall Goal Description',
    )

    # ── Actions ──────────────────────────────────────────────────
    def action_create_goal(self):
        """Create goal record then open template selection dialog (step 2)."""
        self.ensure_one()
        goal = self.env['educare.iep.goal'].with_context(skip_auto_status_flow=True).create({
            'plan_id': self.plan_id.id,
            'name': self.name,
            'goal_domain_id': self.goal_domain_id.id,
            'target_date': self.target_date,
            'priority': self.priority,
            'goal_description': self.goal_description,
        })
        # Pre-create wizard record so _reload_lines() fires on create() and
        # the template list is visible immediately when the dialog opens.
        wizard = self.env['educare.iep.goal.template.select.wizard'].create({
            'goal_id': goal.id,
            'plan_id': self.plan_id.id,
        })
        return {
            'type': 'ir.actions.act_window',
            'name': _('Select Objective Templates'),
            'res_model': 'educare.iep.goal.template.select.wizard',
            'res_id': wizard.id,
            'view_mode': 'form',
            'view_id': self.env.ref(
                'educare_iep.view_educare_iep_goal_template_select_wizard_form'
            ).id,
            'target': 'new',
        }

