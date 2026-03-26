import json
from odoo import models, api


class EducareAuditMixin(models.AbstractModel):
    _name = 'educare.audit.mixin'
    _description = 'Audit Trail Mixin'

    # ── Helper ────────────────────────────────────────────────────────────────
    def _get_audit_log_env(self):
        """Return environment for audit log creation (sudo to bypass ACL)."""
        return self.env['educare.audit.log'].sudo()

    # ── Override create ───────────────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for record in records:
            # Read all field values except metadata fields
            all_values = record.read()[0]
            filtered_values = {
                k: str(v) for k, v in all_values.items()
                if k not in ('id', '__last_update', 'write_date', 'create_date')
            }
            self._get_audit_log_env().create({
                'model_name': self._name,
                'record_id': record.id,
                'record_name': record.display_name,
                'action': 'create',
                'user_id': self.env.uid,
                'new_values': json.dumps(
                    filtered_values,
                    ensure_ascii=False,
                    default=str,
                ),
            })
        return records

    # ── Override write ────────────────────────────────────────────────────────
    def write(self, vals):
        for record in self:
            # Capture OLD values before write
            old_vals = {}
            for field_name in vals:
                if field_name in record._fields:
                    old_vals[field_name] = str(record[field_name])

            self._get_audit_log_env().create({
                'model_name': self._name,
                'record_id': record.id,
                'record_name': record.display_name,
                'action': 'write',
                'user_id': self.env.uid,
                'old_values': json.dumps(
                    old_vals,
                    ensure_ascii=False,
                    default=str,
                ),
                'new_values': json.dumps(
                    {k: str(v) for k, v in vals.items()},
                    ensure_ascii=False,
                    default=str,
                ),
            })
        return super().write(vals)

    # ── Override unlink ───────────────────────────────────────────────────────
    def unlink(self):
        for record in self:
            self._get_audit_log_env().create({
                'model_name': self._name,
                'record_id': record.id,
                'record_name': record.display_name,
                'action': 'unlink',
                'user_id': self.env.uid,
            })
        return super().unlink()