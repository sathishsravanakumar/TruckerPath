import requests
from pprint import pprint

url = "https://docs.shipstation.com/_mock/apis/openapi/v2/freight/quotes"

payload = {
  "freight_provider_account_id": "se-28529731",
  "shipment_id": "se-28529731",
  "ship_from": {
    "name": "Marcus Bell",
    "company_name": "Northgate Distribution",
    "address_line1": "4200 Industrial Pkwy",
    "address_line2": "Dock 12",
    "city_locality": "Grand Rapids",
    "state_province": "MI",
    "postal_code": "49512",
    "country_code": "US",
    "phone": "+1 616 555 0142",
    "email": "dock@northgate-dist.example",
    "location_type": "commercial"
  },
  "ship_to": {
    "name": "Marcus Bell",
    "company_name": "Northgate Distribution",
    "address_line1": "4200 Industrial Pkwy",
    "address_line2": "Dock 12",
    "city_locality": "Grand Rapids",
    "state_province": "MI",
    "postal_code": "49512",
    "country_code": "US",
    "phone": "+1 616 555 0142",
    "email": "dock@northgate-dist.example",
    "location_type": "commercial"
  },
  "shipment_date": "2026-04-17T00:00:00Z",
  "handling_units": [
    {
      "type": "pallet",
      "quantity": 2,
      "length": 48,
      "width": 40,
      "height": 52,
      "dimension_unit": "inch",
      "stackable": False,
      "commodities": [
        {
          "description": "Assembled oak dining chairs",
          "quantity": 24,
          "weight": 310,
          "weight_unit": "pound",
          "packaging_type": "carton",
          "freight_class": "125",
          "nmfc_code": "80700-2"
        }
      ]
    }
  ],
  "accessorials": {
    "liftgate_pickup": True,
    "inside_pickup": False,
    "carrier_terminal_pickup": False,
    "grocery_consolidation_pickup": False,
    "liftgate_delivery": True,
    "inside_delivery": False,
    "appointment_delivery": False,
    "notify_before_delivery": True,
    "hold_at_terminal": False,
    "grocery_consolidation_delivery": False,
    "sort_and_segregate": False,
    "protection_from_cold": False,
    "protection_from_heat": False,
    "tradeshow_pickup": {
      "name": "Midwest Home & Garden Expo",
      "booth_number": "B-1147"
    },
    "tradeshow_delivery": {
      "name": "Midwest Home & Garden Expo",
      "booth_number": "B-1147"
    }
  },
  "insurance": {
    "insured_value": 18500,
    "item_condition": "new",
    "commodity_category": "furniture",
    "marks_numbers": "NG-2026-0417"
  }
}

headers = {
  "Content-Type": "application/json",
  "api-key": "TEST_/hmMjblmg+h2HpjTxzvpjGVkUU7lkY/l841ra3D86nE"
}

response = requests.post(url, json=payload, headers=headers)

data = response.json()
pprint(data)
print("Status Code:", response.status_code)