def send_whatsapp_receipt(order, customer, restaurant_name: str = "Barkat"):
    """
    MOCK PROVIDER for WhatsApp Receipts.
    This simulates a successful WhatsApp API call.
    """
    if not customer or not customer.phone_number:
        return
        
    receipt_text = f"""
======================================
🧾 DIGITAL RECEIPT
======================================
Hello {customer.name or 'Valued Guest'},

Thank you for dining at {restaurant_name}!
Your payment of ₹{order.total_amount} was received.

🌟 LOYALTY POINTS EARNED
--------------------------------------
You earned {int(order.total_amount // 100)} points this visit!
Total Points Balance: {customer.loyalty_points}

We hope to see you again soon.
======================================
    """
    
    # Simulate API Call
    print(f"\n[MOCK WHATSAPP API] Message successfully sent to +91 {customer.phone_number}:")
    print(receipt_text)
    print("-" * 50)
