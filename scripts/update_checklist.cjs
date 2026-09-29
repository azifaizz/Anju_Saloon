const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '.agents', 'docs', 'FEATURE_CHECKLIST.md');
let content = fs.readFileSync(filePath, 'utf8');

const completions = [
    "- [ ] Admin can manage products",
    "- [ ] Admin can manage services",
    "- [ ] Product list",
    "- [ ] Product create",
    "- [ ] Product edit",
    "- [ ] Product view/details",
    "- [ ] Product deactivate/activate",
    "- [ ] Product search",
    "- [ ] Product category",
    "- [ ] Selling price",
    "- [ ] Product description",
    "- [ ] Product status",
    "- [ ] Product timestamps",
    "- [ ] Product API updated",
    "- [ ] Product frontend updated",
    "- [ ] Service list",
    "- [ ] Service create",
    "- [ ] Service edit",
    "- [ ] Service details",
    "- [ ] Service activate/deactivate",
    "- [ ] Service search",
    "- [ ] Service category",
    "- [ ] Service price",
    "- [ ] Service duration",
    "- [ ] Service description",
    "- [ ] Service API",
    "- [ ] Service billing integration",
    "- [ ] Product cart item",
    "- [ ] Service cart item",
    "- [ ] Mixed product/service cart",
    "- [ ] Customer association",
    "- [ ] Staff assignment per service item",
    "- [ ] Multiple staff in same bill",
    "- [ ] Quantity",
    "- [ ] Price validation",
    "- [ ] Service validation",
    "- [ ] Subtotal",
    "- [ ] Discount",
    "- [ ] Tax if required by final business rules",
    "- [ ] Grand total",
    "- [ ] Payment",
    "- [ ] Percentage commission",
    "- [ ] Fixed commission",
    "- [ ] Service-level commission",
    "- [ ] Staff-level commission where applicable",
    "- [ ] Commission calculation",
    "- [ ] Commission tied to bill item",
    "- [ ] Commission tied to staff",
    "- [ ] Multiple staff commission on same bill",
    "- [ ] Hero reviewed",
    "- [ ] Textile copy removed",
    "- [ ] Salon copy added",
    "- [ ] Salon services represented",
    "- [ ] Contact information updated",
    "- [ ] Existing design language preserved",
    "- [ ] All textile CSS references identified",
    "- [ ] Unused textile classes removed",
    "- [ ] Active salon styles preserved",
    "- [ ] No accidental color-system change",
    "- [ ] No accidental layout redesign",
    "- [ ] Product migration mapping created",
    "- [ ] Product documents migrated",
    "- [ ] Product IDs preserved where safe",
    "- [ ] Categories migrated",
    "- [ ] Service migration mapping created",
    "- [ ] Service documents migrated",
    "- [ ] Service IDs preserved where safe",
    "- [ ] Service categories migrated",
];

completions.forEach(item => {
    const completedItem = item.replace("- [ ]", "- [x]");
    const inProgressItem = item.replace("- [ ]", "- [~]");
    
    // Global replace for exact matches
    content = content.replace(new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), completedItem);
    content = content.replace(new RegExp(inProgressItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), completedItem);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Checklist updated successfully.');
