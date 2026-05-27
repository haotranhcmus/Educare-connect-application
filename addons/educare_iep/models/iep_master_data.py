from odoo import fields, models


class EducareIepFramework(models.Model):
    _name = "educare.iep.framework"
    _description = "Assessment Framework Reference"
    _order = "sequence, name"

    name = fields.Char(string="Framework Name", required=True, translate=True)
    code = fields.Char(string="Code", required=True, size=32)
    description = fields.Text(string="Description", translate=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)

    _sql_constraints = [
        ("code_unique", "UNIQUE(code)", "Framework code must be unique."),
    ]


class EducareIepMeasurementTemplate(models.Model):
    _name = "educare.iep.measurement.template"
    _description = "Goal Measurement Template"
    _order = "sequence, name"

    name = fields.Char(string="Template Name", required=True, translate=True)
    code = fields.Char(string="Code", required=True, size=32)
    criteria_template = fields.Text(
        string="Measurement Criteria Template",
        required=True,
        translate=True,
    )
    condition_template = fields.Text(
        string="Measurement Condition Template",
        translate=True,
    )
    description = fields.Text(string="Description", translate=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)

    _sql_constraints = [
        ("mt_code_unique", "UNIQUE(code)", "Measurement template code must be unique."),
    ]


class EducareIepPromptLevel(models.Model):
    _name = "educare.iep.prompt.level"
    _description = "Prompt / Support Level"
    _order = "sequence, name"

    name = fields.Char(string="Name", required=True, translate=True)
    code = fields.Char(string="Code", required=True, size=32)
    description = fields.Text(string="Description", translate=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)

    _sql_constraints = [
        ("code_unique", "UNIQUE(code)", "Prompt level code must be unique."),
    ]


class EducareIepTeachingMethod(models.Model):
    _name = "educare.iep.teaching.method"
    _description = "Teaching Method"
    _order = "sequence, name"

    name = fields.Char(string="Name", required=True, translate=True)
    code = fields.Char(string="Code", required=True, size=32)
    description = fields.Text(string="Description", translate=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)

    _sql_constraints = [
        ("code_unique", "UNIQUE(code)", "Teaching method code must be unique."),
    ]


class EducareIepDataCollectionMethod(models.Model):
    _name = "educare.iep.data.collection.method"
    _description = "Data Collection Method"
    _order = "sequence, name"

    name = fields.Char(string="Name", required=True, translate=True)
    code = fields.Char(string="Code", required=True, size=32)
    description = fields.Text(string="Description", translate=True)
    sequence = fields.Integer(string="Sequence", default=10)
    active = fields.Boolean(string="Active", default=True)

    _sql_constraints = [
        ("code_unique", "UNIQUE(code)", "Data collection method code must be unique."),
    ]


class EducareIepDifficultyWeight(models.Model):
    _name = "educare.iep.difficulty.weight"
    _description = "Difficulty Level Weight Configuration"
    _order = "sequence"

    name = fields.Char(
        string="Tên độ khó",
        required=True,
        translate=True,
        help="Tên mức độ khó, ví dụ: Rất dễ, Dễ, Trung bình, Khó, Rất khó.",
    )
    sequence = fields.Integer(string="Thứ tự", default=10)
    weight = fields.Float(
        string="Trọng số",
        required=True,
        digits=(5, 2),
        default=1.0,
        help="Trọng số tự động gán cho mục tiêu ngắn hạn theo độ khó này. "
        "Độ khó cao hơn → trọng số lớn hơn → ảnh hưởng nhiều hơn đến tiến độ mục tiêu dài hạn.",
    )
    description = fields.Text(string="Mô tả", translate=True)
    active = fields.Boolean(string="Hoạt động", default=True)

    _sql_constraints = [
        ("name_unique", "UNIQUE(name)", "Tên độ khó phải là duy nhất."),
        ("weight_positive", "CHECK(weight > 0)", "Trọng số phải lớn hơn 0."),
    ]
