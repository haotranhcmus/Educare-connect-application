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


class EducareIepPromptLevel(models.Model):
    _name = 'educare.iep.prompt.level'
    _description = 'Prompt / Support Level'
    _order = 'sequence, name'

    name = fields.Char(string='Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Prompt level code must be unique.'),
    ]


class EducareIepTeachingMethod(models.Model):
    _name = 'educare.iep.teaching.method'
    _description = 'Teaching Method'
    _order = 'sequence, name'

    name = fields.Char(string='Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Teaching method code must be unique.'),
    ]


class EducareIepDataCollectionMethod(models.Model):
    _name = 'educare.iep.data.collection.method'
    _description = 'Data Collection Method'
    _order = 'sequence, name'

    name = fields.Char(string='Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=32)
    description = fields.Text(string='Description', translate=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Data collection method code must be unique.'),
    ]
