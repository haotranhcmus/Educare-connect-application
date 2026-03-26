/** @odoo-module **/
/**
 * domain_color_badge — Custom Many2one field widget
 * Shows the field value as a colored badge using a hex color from a
 * companion Char field (e.g. domain_color storing "#rrggbb").
 *
 * Usage in tree/form:
 *   <field name="domain_id" widget="domain_color_badge" options='{"color_field": "domain_color"}' />
 *   (color_field defaults to "domain_color" if omitted)
 */
import { registry } from "@web/core/registry";
import { Component, xml } from "@odoo/owl";

class DomainColorBadgeField extends Component {
  static props = {
    record: { type: Object },
    name: { type: String },
    colorField: { type: String, optional: true },
    // allow Odoo to pass any other standard field props through
    "*": true,
  };

  /** Hex color string (e.g. "#E57373") from the companion field on this record */
  get hexColor() {
    const colorField = this.props.colorField || "domain_color";
    return this.props.record.data[colorField] || "#cccccc";
  }

  /** Display name from the Many2one value ([id, name] tuple or false) */
  get displayName() {
    const value = this.props.record.data[this.props.name];
    if (!value) return "";
    return Array.isArray(value) ? value[1] : String(value);
  }

  static template = xml`
        <span t-if="displayName"
              class="badge o_tag"
              t-att-style="'background-color:' + hexColor + '; border-color:' + hexColor + '; color:#fff;'">
            <t t-esc="displayName"/>
        </span>
    `;
}

registry.category("fields").add("domain_color_badge", {
  component: DomainColorBadgeField,
  displayName: "Domain Color Badge",
  supportedTypes: ["many2one"],
  /** Read color_field from options JSON: options='{"color_field": "domain_color"}' */
  extractProps({ attrs, options }) {
    return { colorField: (options && options.color_field) || "domain_color" };
  },
});
