from odoo import fields, models


class EducareIepFramework(models.Model):
    _name = 'educare.iep.framework'
    _description = 'Assessment Framework Reference'
    _order = 'sequence, name'

    name = fields.Char(string='Framework Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Framework code must be unique.'),
    ]


class EducareIepPromptLevel(models.Model):
    _name = 'educare.iep.prompt.level'
    _description = 'Prompt Support Level'
    _order = 'sequence'

    name = fields.Char(string='Prompt Level', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(
        string='Sequence',
        default=10,
        help='Lower = more independent; higher = more support needed',
    )
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Prompt level code must be unique.'),
    ]


class EducareIepProbeMethod(models.Model):
    _name = 'educare.iep.probe.method'
    _description = 'Data Collection Probe Method'
    _order = 'sequence, name'

    name = fields.Char(string='Probe Method', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Probe method code must be unique.'),
    ]


class EducareIepPriority(models.Model):
    _name = 'educare.iep.priority'
    _description = 'Goal Priority Level'
    _order = 'sequence'

    name = fields.Char(string='Priority', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    color = fields.Integer(string='Color Index', default=0)
    sequence = fields.Integer(
        string='Sequence',
        default=10,
        help='Lower = less urgent; higher = more urgent (High should have the highest sequence)',
    )
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Priority code must be unique.'),
    ]


class EducareIepMeasurementTemplate(models.Model):
    _name = 'educare.iep.measurement.template'
    _description = 'Goal Measurement Template'
    _order = 'sequence, name'

    name = fields.Char(string='Template Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    criteria_template = fields.Text(
        string='Measurement Criteria Template',
        required=True,
        translate=True,
    )
    condition_template = fields.Text(
        string='Measurement Condition Template',
        translate=True,
    )
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('mt_code_unique', 'UNIQUE(code)', 'Measurement template code must be unique.'),
    ]
