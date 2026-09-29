import os

file_path = r"c:\Users\ASEEL\Desktop\Flip Flex\Anju Saloon\.agents\docs\FEATURE_CHECKLIST.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Lines to check off
completions = [
    # Admin
    "- [ ] Admin can manage products",
    "- [ ] Admin can manage services",
    
    # Products
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

    # Services
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

    # Billing POS
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

    # Commission
    "- [ ] Percentage commission",
    "- [ ] Fixed commission",
    "- [ ] Service-level commission",
    "- [ ] Staff-level commission where applicable",
    "- [ ] Commission calculation",
    "- [ ] Commission tied to bill item",
    "- [ ] Commission tied to staff",
    "- [ ] Multiple staff commission on same bill",

    # Landing Page
    "- [ ] Hero reviewed",
    "- [ ] Textile copy removed",
    "- [ ] Salon copy added",
    "- [ ] Salon services represented",
    "- [ ] Contact information updated",
    "- [ ] Existing design language preserved",
    
    # CSS Cleanup
    "- [ ] All textile CSS references identified",
    "- [ ] Unused textile classes removed",
    "- [ ] Active salon styles preserved",
    "- [ ] No accidental color-system change",
    "- [ ] No accidental layout redesign",

    # Migration
    "- [ ] Product migration mapping created",
    "- [ ] Product documents migrated",
    "- [ ] Product IDs preserved where safe",
    "- [ ] Categories migrated",
    "- [ ] Service migration mapping created",
    "- [ ] Service documents migrated",
    "- [ ] Service IDs preserved where safe",
    "- [ ] Service categories migrated",
]

for item in completions:
    completed_item = item.replace("- [ ]", "- [x]").replace("- [~]", "- [x]")
    # Also check if it was marked [~]
    in_progress_item = item.replace("- [ ]", "- [~]")
    
    if item in content:
        content = content.replace(item, completed_item)
    elif in_progress_item in content:
        content = content.replace(in_progress_item, completed_item)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Checklist updated successfully.")
