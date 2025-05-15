# Facebook Pixel Implementation Guide for GoHighLevel

This guide provides code for GoHighLevel's header and footer tracking code sections.

## CHECKOUT PAGE

### Header Tracking Code
Add this to the "Header Tracking Code" section:

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '924341239600510');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=924341239600510&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```

### Footer Tracking Code
Add this to the "Footer Tracking Code" section:

```html
<script>
// Track checkout events
fbq('track', 'InitiateCheckout', {
  content_name: 'The Art of AI Sampling Course',
  value: 98.00,
  currency: 'USD'
});

// Track when the purchase button is clicked
document.addEventListener('DOMContentLoaded', function() {
  const purchaseButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], .submit-button, .checkout-button');
  purchaseButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      fbq('track', 'AddPaymentInfo', {
        content_name: 'The Art of AI Sampling Course',
        value: 98.00,
        currency: 'USD'
      });
    });
  });
});
</script>
```

## THANK YOU PAGE

### Header Tracking Code
Add this to the "Header Tracking Code" section:

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '924341239600510');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=924341239600510&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```

### Footer Tracking Code
Add this to the "Footer Tracking Code" section:

```html
<script>
// Purchase event - fires when thank you page loads
fbq('track', 'Purchase', {
  content_name: 'The Art of AI Sampling Course',
  content_ids: ['TACHES-AI-SAMPLING'],
  value: 98.00,
  currency: 'USD',
  order_id: 'ORDER' + Date.now()  // Generates a unique order ID
});
</script>
```

## IMPLEMENTATION STEPS

1. In GoHighLevel, go to your funnel's checkout page:
   - Paste the checkout header code into the "Header Tracking Code" field
   - Paste the checkout footer code into the "Footer Tracking Code" field

2. In GoHighLevel, go to your funnel's thank you page:
   - Paste the thank you header code into the "Header Tracking Code" field
   - Paste the thank you footer code into the "Footer Tracking Code" field

3. Important Notes:
   - Adjust the price value (98.00) if your course has a different price
   - If GoHighLevel provides order IDs, use their variable instead of 'ORDER' + Date.now()
   - The button selector tries multiple common classes/types - adjust if needed for your specific GoHighLevel template