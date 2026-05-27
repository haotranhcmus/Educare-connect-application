# -*- coding: utf-8 -*-
{
    'name': 'AI Mobile Tools - Project',
    'version': '1.0',
    'category': 'AI',
    'summary': 'Project-specific mobile AI tools and demo data',
    'description': """
AI Mobile Tools - Project Module
=================================

This module contains project-specific configurations and demo data for AI mobile tools.

It depends on:
- ai_mobile_tools: Low-level mobile tool infrastructure
- project: Project management module (for demo tools)

Use this module to define mobile tools that interact with specific Odoo models
from your project (e.g., project.project, project.task, hr.attendance, etc.)
    """,
    'author': 'xBoss',
    'depends': [
        'ai_mobile_tools',
        'project',
    ],
    'data': [
        'data/project_mobile_tools.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
