from odoo import _, api, fields, models
from odoo.exceptions import UserError


class EducareIepGoalTemplateSelectWizard(models.TransientModel):
    _name = 'educare.iep.goal.template.select.wizard'
    _description = 'Select Objective Templates for IEP Goal (Step 2)'

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
    goal_domain_id = fields.Many2one(
        'educare.domain',
        related='goal_id.goal_domain_id',
        string='Development Domain',
        readonly=True,
    )
    search_term = fields.Char(
        string='Search',
        help='Filter templates by name',
    )
    line_ids = fields.One2many(
        'educare.iep.goal.template.select.wizard.line',
        'wizard_id',
        string='Templates',
    )
    selected_count = fields.Integer(
        string='Selected',
        compute='_compute_selected_count',
    )

    @api.depends('line_ids.selected')
    def _compute_selected_count(self):
        for wizard in self:
            wizard.selected_count = len(wizard.line_ids.filtered('selected'))

    def _build_template_domain(self):
        """Always filter by goal's domain (M2M 'in' operator). No user override."""
        domain = [('active', '=', True)]
        if self.goal_domain_id:
            domain.append(('template_domain_ids', 'in', self.goal_domain_id.id))
        if self.search_term and self.search_term.strip():
            domain.append(('name', 'ilike', self.search_term.strip()))
        return domain

    def _reload_lines(self):
        self.ensure_one()
        templates = self.env['educare.iep.objective.template'].search(
            self._build_template_domain(),
            order='sequence, name',
        )
        self.line_ids.unlink()
        Line = self.env['educare.iep.goal.template.select.wizard.line']
        for seq, tpl in enumerate(templates, start=1):
            Line.create({
                'wizard_id': self.id,
                'template_id': tpl.id,
                'sequence': seq,
                'selected': False,
            })

    @api.model_create_multi
    def create(self, vals_list):
        wizards = super().create(vals_list)
        for wizard in wizards:
            wizard._reload_lines()
        return wizards

    def action_apply_filters(self):
        """Reload lines based on search term, preserving selections."""
        self.ensure_one()
        previously_selected = {
            line.template_id.id
            for line in self.line_ids
            if line.selected and line.template_id
        }
        self._reload_lines()
        for line in self.line_ids:
            if line.template_id.id in previously_selected:
                line.selected = True
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'educare.iep.goal.template.select.wizard',
            'res_id': self.id,
            'view_mode': 'form',
            'view_id': self.env.ref(
                'educare_iep.view_educare_iep_goal_template_select_wizard_form'
            ).id,
            'target': 'new',
        }

    def action_next_configure(self):
        """Step 2 → Step 3: Open configure wizard with selected templates."""
        self.ensure_one()
        selected_lines = self.line_ids.filtered(lambda l: l.selected and l.template_id)
        if not selected_lines:
            raise UserError(_('Please select at least 1 template to import.'))

        ConfigWizard = self.env['educare.iep.objective.configure.wizard']
        config = ConfigWizard.create({
            'goal_id': self.goal_id.id,
            'plan_id': self.plan_id.id,
        })
        for line in selected_lines.sorted('sequence'):
            tpl = line.template_id
            self.env['educare.iep.objective.configure.wizard.line'].create({
                'wizard_id': config.id,
                'template_id': tpl.id,
                'name': tpl.name,
                'description': tpl.description,
                'baseline_accuracy_pct': tpl.default_baseline_accuracy_pct or 0.0,
                'target_accuracy_pct': tpl.default_target_accuracy_pct or 80.0,
                'consecutive_sessions_required': tpl.default_consecutive_sessions or 3,
                'weight': 1.0,
                'baseline_description': tpl.baseline_description or '',
            })
        return {
            'type': 'ir.actions.act_window',
            'name': _('Configure Objectives'),
            'res_model': 'educare.iep.objective.configure.wizard',
            'res_id': config.id,
            'view_mode': 'form',
            'view_id': self.env.ref(
                'educare_iep.view_educare_iep_objective_configure_wizard_form'
            ).id,
            'target': 'new',
        }

    def _return_to_plan(self):
        return {
            'type': 'ir.actions.act_window',
            'name': _('IEP Plan'),
            'res_model': 'educare.iep.plan',
            'res_id': self.plan_id.id,
            'view_mode': 'form',
            'target': 'current',
        }


class EducareIepGoalTemplateSelectWizardLine(models.TransientModel):
    _name = 'educare.iep.goal.template.select.wizard.line'
    _description = 'Objective Template Selection Line'
    _order = 'sequence, id'

    wizard_id = fields.Many2one(
        'educare.iep.goal.template.select.wizard',
        required=True,
        ondelete='cascade',
    )
    selected = fields.Boolean(string='Select', default=False)
    template_id = fields.Many2one(
        'educare.iep.objective.template',
        string='Template Name',
        ondelete='cascade',
        readonly=True,
    )
    sequence = fields.Integer(default=10)
    template_domain_ids = fields.Many2many(
        'educare.domain',
        related='template_id.template_domain_ids',
        string='Domains',
        readonly=True,
    )
    difficulty_level = fields.Integer(
        related='template_id.difficulty_level',
        string='Difficulty',
        readonly=True,
    )
    default_target_accuracy_pct = fields.Float(
        related='template_id.default_target_accuracy_pct',
        string='Suggested Target (%)',
        readonly=True,
    )
