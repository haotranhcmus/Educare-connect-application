{
    'name': 'Educare Student',
    'version': '17.0.1.0.0',
    'category': 'Education',
    'summary': 'Student Profile — Single Source of Truth',
    'author': 'Educare',
    'depends': ['base', 'mail', 'educare_base', 'educare_security'],
    'data': [
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'data/sequence_data.xml',
        'data/assessment_item_data.xml',
        'views/assessment_views.xml',
        'views/assessment_item_views.xml',
        'views/student_form.xml',
        'views/student_tree.xml',
        'views/student_search.xml',
        'views/student_kanban.xml',
        'views/menu.xml',
        'views/user_profile_ext_views.xml',
    ],
    'demo': [
        'data/demo_students.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'educare_student/static/src/js/domain_color_badge.js',
        ],
    },
    'installable': True,
    'license': 'LGPL-3',
}