from flask import Flask, request, jsonify

import asyncio
import aiohttp
import folium
from pymongo import MongoClient

app = Flask(__name__)

async def init_map(ip_list):
    # Replace fetchData() with your Python data fetching logic
    data = await fetch_data(ip_list)

    # Initialize map with max zoom 32
    if data:
        center_lat = data[0]['lat']
        center_lon = data[0]['lon']
    else:
        center_lat, center_lon = 0, 0

    m = folium.Map(location=[center_lat, center_lon], zoom_start=2, max_zoom=32)

    # Add OpenStreetMap base layer (folium uses OSM by default)
    # For Google Satellite, you would need a plugin or custom tile layer

    # Add markers with mouseover tooltips (only lat/lon shown on hover)
    bounds = []
    for entry in data:
        marker = folium.Marker(
            location=[entry['lat'], entry['lon']],
            tooltip=folium.Tooltip(
                f"Lat: {entry['lat']}, Lon: {entry['lon']}",
                sticky=False
            )
        )
        marker.add_to(m)
        bounds.append([entry['lat'], entry['lon']])

    # Adjust map zoom to fit all markers
    if len(bounds) > 1:
        m.fit_bounds(bounds)
    elif len(bounds) == 1:
        m.location = bounds[0]
        m.zoom_start = 10

    # Save or display the map
    m.save("map.html")

# Example placeholder for fetch_data
async def fetch_data(ip_list):
    # ip_list: list of IP strings
    results = []
    # 1. Gather IPs from ARPDB (MongoDB)
    mongo_client = MongoClient("mongodb://localhost:27017")
    db = mongo_client["ARPDB"]
    mac_collection = db["macAddresses"]
    # Get all unique IPs from ARPDB if not already in ip_list
    arpdb_ips = set()
    for doc in mac_collection.find({"ip": {"$exists": True}}):
        arpdb_ips.add(doc["ip"])
    # Merge and deduplicate
    all_ips = list(set(ip_list) | arpdb_ips)

    async with aiohttp.ClientSession() as session:
        for ip in all_ips:
            url = f"https://stat.ripe.net/data/prefix-overview/data.json?resource={ip}"
            async with session.get(url) as resp:
                data = await resp.json()
                # Extract geolocation if available
                loc = data.get("data", {}).get("located_resources", [])
                if loc and "latitude" in loc[0] and "longitude" in loc[0]:
                    lat = loc[0]["latitude"]
                    lon = loc[0]["longitude"]
                else:
                    lat, lon = 0, 0  # fallback if not found
                asn = data.get("data", {}).get("asns", [{}])[0].get("asn", "Unknown")
                results.append({
                    "ip": ip,
                    "asn": asn,
                    "lat": lat,
                    "lon": lon
                })
    mongo_client.close()
    return results

@app.route('/api/geolocate', methods=['POST'])
def geolocate():
    ip_list = request.json.get('ips', [])
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    data = loop.run_until_complete(fetch_data(ip_list))
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000)