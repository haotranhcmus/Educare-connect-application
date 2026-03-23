from odoo import _, api
from odoo.exceptions import ValidationError


class AccuracyValidationMixin:
    """Shared accuracy validation for wizard models.

    Any TransientModel that has baseline_accuracy_pct and target_accuracy_pct
    can reuse this mixin instead of duplicating the same constraint logic.
    """

    @api.constrains('baseline_accuracy_pct', 'target_accuracy_pct')
    def _check_accuracy_values(self):
        for rec in self:
            name = getattr(rec, 'name', '')
            if rec.baseline_accuracy_pct < 0 or rec.baseline_accuracy_pct > 100:
                raise ValidationError(
                    _('Baseline accuracy must be between 0 and 100%s.')
                    % (f' for "{name}"' if name else '')
                )
            if rec.target_accuracy_pct < 0 or rec.target_accuracy_pct > 100:
                raise ValidationError(
                    _('Target accuracy must be between 0 and 100%s.')
                    % (f' for "{name}"' if name else '')
                )
            if rec.target_accuracy_pct <= rec.baseline_accuracy_pct:
                raise ValidationError(
                    _('Target accuracy must be greater than baseline accuracy%s.')
                    % (f' for "{name}"' if name else '')
                )
