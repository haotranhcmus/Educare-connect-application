{
    'name': 'Educare Security',
    'version': '17.0.1.0.0',
    'category': 'Education',
    'summary': 'Security infrastructure — User roles, audit trail, access control',
    'author': 'Educare',
    'depends': ['base', 'mail', 'educare_base'],
    'data': [
        'security/educare_groups.xml',
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'views/user_profile_views.xml',
        'views/audit_log_views.xml',
        'views/menu.xml',
    ],
    'installable': True,
    'license': 'LGPL-3',
}