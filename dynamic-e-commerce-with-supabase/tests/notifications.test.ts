import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOrderWhatsAppMessage } from "../src/services/notifications.ts";

describe("WhatsApp order message", () => {
  it("includes the required details for a booking request", () => {
    const message = buildOrderWhatsAppMessage({
      id: "order_123",
      orderNumber: 1042,
      customerName: "أحمد علي",
      phone: "07701234567",
      address: "بغداد - المنصور - شارع 10",
      notes: "يرجى التواصل بعد الساعة 5",
      status: "new",
      total: 25000000,
      createdAt: "2026-10-01T10:00:00.000Z",
      items: [
        {
          id: "item_1",
          productId: "prod_1",
          productName: "iPhone 16 Pro Max",
          unitPrice: 25000000,
          quantity: 1,
        },
      ],
      province: "بغداد",
      region: "المنصور",
      color: "أسود",
      capacity: "256GB",
      paymentMethod: "cash",
    } as any);

    assert.match(message, /طلب حجز جديد/i);
    assert.match(message, /الجهاز:\s*iPhone 16 Pro Max/i);
    assert.match(message, /السعة:\s*256GB/i);
    assert.match(message, /اللون:\s*أسود/i);
    assert.match(message, /السعر:\s*25,000,000/i);
    assert.match(message, /الكمية:\s*1/i);
    assert.match(message, /اسم الزبون:\s*أحمد علي/i);
    assert.match(message, /رقم الهاتف:\s*07701234567/i);
    assert.match(message, /المحافظة:\s*بغداد/i);
    assert.match(message, /المنطقة:\s*المنصور/i);
    assert.match(message, /العنوان:\s*بغداد - المنصور - شارع 10/i);
    assert.match(message, /الملاحظات:\s*يرجى التواصل بعد الساعة 5/i);
  });
});
