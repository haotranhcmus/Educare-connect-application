from odoo import _, api, fields, models
from odoo.exceptions import UserError


class EducareIepObjectiveConfigureWizard(models.TransientModel):
    _name = 'educare.iep.objective.configure.wizard'
    _description = 'Configure Student-Specific Objective Data (Step 3)'

    goal_id = fields.Many2one(
        'educare.iep.goal',
        string='Goal',
        required=True,
        ondelete='cascade',
    )
    plan_id = fields.Many2one(
        'educare.iep.plan',
        string='IEP Plan',
        required=True,
        ondelete='cascade',
    )
    goal_name = fields.Char(
        related='goal_id.name',
        string='Goal Name',
        readonly=True,
    )
    line_ids = fields.One2many(
        'educare.iep.objective.configure.wizard.line',
        'wizard_id',
        string='Objectives to Create',
    )

    def action_confirm(self):
        """Create actual objectives from configured lines."""
        self.ensure_one()
        if not self.line_ids:
            raise UserError(_('No objectives to create.'))

        Objective = self.env['educare.iep.objective']
        for line in self.line_ids:
            vals = {
                'goal_id': self.goal_id.id,
                'name': line.name,
                'description': line.description,
                'baseline_accuracy_pct': line.baseline_accuracy_pct,
                'target_accuracy_pct': line.target_accuracy_pct,
                'consecutive_sessions_required': line.consecutive_sessions_required,
                'weight': line.weight,
                'status': 'not_started',
                'baseline_description': line.baseline_description or False,
                'measurement_method': _('Direct observation during session.'),
            }
            # Carry all enrichment data from source template
            if line.template_id:
                tpl = line.template_id
                vals.update({
                    'source_template_id': tpl.id,
                    'smart_specific': tpl.smart_specific or False,
                    'smart_measurable': tpl.smart_measurable or False,
                    'smart_analysis': tpl.smart_analysis or False,
                    'smart_timebound': tpl.smart_timebound or False,
                    'materials_needed': tpl.materials_needed or False,
                    'implementation_steps': tpl.implementation_steps or False,
                    'age_min_months': tpl.age_min_months or False,
                    'age_max_months': tpl.age_max_months or False,
                    'difficulty_level': tpl.difficulty_level or 1,
                    'relevant_diagnosis_ids': [(6, 0, tpl.relevant_diagnosis_ids.ids)],
                    'suggested_prompt_level_id': tpl.suggested_prompt_level.id if tpl.suggested_prompt_level else False,
                    'measurement_template_id': tpl.measurement_template_id.id if tpl.measurement_template_id else False,
                })
                if tpl.measurement_template_id:
                    vals['measurement_method'] = tpl.measurement_template_id.criteria_template
            Objective.create(vals)

        return {
            'type': 'ir.actions.act_window',
            'name': _('IEP Plan'),
            'res_model': 'educare.iep.plan',
            'res_id': self.plan_id.id,
            'view_mode': 'form',
            'target': 'current',
        }


class EducareIepObjectiveConfigureWizardLine(models.TransientModel):
    _name = 'educare.iep.objective.configure.wizard.line'
    _description = 'Objective Configuration Line'
    _order = 'id'

    wizard_id = fields.Many2one(
        'educare.iep.objective.configure.wizard',
        required=True,
        ondelete='cascade',
    )
    template_id = fields.Many2one(
        'educare.iep.objective.template',
        string='Template',
        readonly=True,
    )
    name = fields.Char(string='Objective Name', required=True)
    description = fields.Text(string='Description')
    baseline_accuracy_pct = fields.Float(
        string='Baseline (%)',
        digits=(5, 2),
        default=0.0,
    )
    target_accuracy_pct = fields.Float(
        string='Target (%)',
        digits=(5, 2),
        default=80.0,
    )
    consecutive_sessions_required = fields.Integer(
        string='Consec. Sessions',
        default=3,
    )
    weight = fields.Float(
        string='Weight',
        digits=(5, 2),
        default=1.0,
    )
    baseline_description = fields.Text(string='Baseline Description')

    # --- Template preview fields (readonly, for review before import) ---
    smart_specific = fields.Text(
        related='template_id.smart_specific',
        string='S - Specific',
        readonly=True,
    )
    smart_measurable = fields.Char(
        related='template_id.smart_measurable',
        string='M - Measurable',
        readonly=True,
    )
    smart_analysis = fields.Text(
        related='template_id.smart_analysis',
        string='A/R - Achievable & Relevant',
        readonly=True,
    )
    smart_timebound = fields.Char(
        related='template_id.smart_timebound',
        string='T - Time-Bound',
        readonly=True,
    )
    materials_needed = fields.Text(
        related='template_id.materials_needed',
        string='Materials Needed',
        readonly=True,
    )
    implementation_steps = fields.Text(
        related='template_id.implementation_steps',
        string='Implementation Steps',
        readonly=True,
    )
    difficulty_level = fields.Integer(
        related='template_id.difficulty_level',
        string='Difficulty Level',
        readonly=True,
    )
    age_min_months = fields.Integer(
        related='template_id.age_min_months',
        string='Min Age (months)',
        readonly=True,
    )
    age_max_months = fields.Integer(
        related='template_id.age_max_months',
        string='Max Age (months)',
        readonly=True,
    )
    suggested_prompt_level = fields.Many2one(
        related='template_id.suggested_prompt_level',
        string='Suggested Prompt Level',
        readonly=True,
    )
    measurement_template_id = fields.Many2one(
        related='template_id.measurement_template_id',
        string='Measurement Template',
        readonly=True,
    )
