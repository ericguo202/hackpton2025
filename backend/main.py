from contextlib import asynccontextmanager
import os
from pathlib import Path
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, select 
from sqlalchemy.ext.asyncio import AsyncEngine
from deps import engine, SessionDep
from routes import routes
from deps import RedisDep
from rate_limit import RateLimitMiddleware
from models.dbmodels import Charity
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Charity))
        existing = result.scalars().all()

        if len(existing) == 0:  
            # Seed charities with diverse locations across the US
            charities = [
                Charity(
                    username="hopehouse_nyc",
                    password=hash_password("password123"),
                    name="Hope House NYC",
                    address="245 E 124th St, New York, NY 10035",
                    description="Community food bank serving East Harlem families with nutritious meals and food assistance programs.",
                    website="https://hopehousenyc.org",
                    contact="contact@hopehousenyc.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-73.9358, 40.8021]}, "properties": {"label": "245 E 124th St, New York, NY 10035", "provider": "seed"}}
                ),
                Charity(
                    username="harvest_la",
                    password=hash_password("password123"),
                    name="LA Harvest Mission",
                    address="1234 S Central Ave, Los Angeles, CA 90021",
                    description="Fighting hunger in downtown LA through meal services and emergency food distribution.",
                    website="https://laharvestmission.org",
                    contact="info@laharvestmission.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.2533, 34.0195]}, "properties": {"label": "1234 S Central Ave, Los Angeles, CA 90021", "provider": "seed"}}
                ),
                Charity(
                    username="secondharvest_chi",
                    password=hash_password("password123"),
                    name="Second Harvest Chicago",
                    address="4100 W Ann Lurie Pl, Chicago, IL 60632",
                    description="The largest food bank in the Midwest, distributing millions of meals annually to those in need.",
                    website="https://secondharvestchicago.org",
                    contact="help@secondharvestchi.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-87.7293, 41.8119]}, "properties": {"label": "4100 W Ann Lurie Pl, Chicago, IL 60632", "provider": "seed"}}
                ),
                Charity(
                    username="meals_houston",
                    password=hash_password("password123"),
                    name="Houston Meals on Wheels",
                    address="550 Westcott St, Houston, TX 77007",
                    description="Delivering hot meals and hope to homebound seniors across Houston.",
                    website="https://houstonmeals.org",
                    contact="contact@houstonmeals.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-95.3890, 29.7752]}, "properties": {"label": "550 Westcott St, Houston, TX 77007", "provider": "seed"}}
                ),
                Charity(
                    username="phoenix_pantry",
                    password=hash_password("password123"),
                    name="Phoenix Community Pantry",
                    address="1817 S 7th Ave, Phoenix, AZ 85007",
                    description="Providing food assistance and nutrition education to Phoenix families.",
                    website="https://phoenixpantry.org",
                    contact="info@phoenixpantry.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-112.0833, 33.4368]}, "properties": {"label": "1817 S 7th Ave, Phoenix, AZ 85007", "provider": "seed"}}
                ),
                Charity(
                    username="philly_share",
                    password=hash_password("password123"),
                    name="Philabundance",
                    address="3616 S Galloway St, Philadelphia, PA 19148",
                    description="Delaware Valley's largest hunger relief organization serving millions of meals each year.",
                    website="https://philabundance.org",
                    contact="share@philabundance.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-75.1532, 39.9158]}, "properties": {"label": "3616 S Galloway St, Philadelphia, PA 19148", "provider": "seed"}}
                ),
                Charity(
                    username="san_antonio_food",
                    password=hash_password("password123"),
                    name="San Antonio Food Bank",
                    address="5200 Enrique M Barrera Pkwy, San Antonio, TX 78227",
                    description="Feeding hungry people today and building pathways to self-sufficiency.",
                    website="https://safoodbank.org",
                    contact="contact@safoodbank.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-98.5618, 29.4070]}, "properties": {"label": "5200 Enrique M Barrera Pkwy, San Antonio, TX 78227", "provider": "seed"}}
                ),
                Charity(
                    username="sandiego_rescue",
                    password=hash_password("password123"),
                    name="San Diego Rescue Mission",
                    address="120 Elm St, San Diego, CA 92101",
                    description="Providing meals, shelter, and recovery programs for San Diego's homeless.",
                    website="https://sdrescue.org",
                    contact="help@sdrescue.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-117.1625, 32.7157]}, "properties": {"label": "120 Elm St, San Diego, CA 92101", "provider": "seed"}}
                ),
                Charity(
                    username="dallas_harvest",
                    password=hash_password("password123"),
                    name="North Texas Food Bank",
                    address="4500 S Cockrell Hill Rd, Dallas, TX 75236",
                    description="Closing the hunger gap in North Texas through food distribution and advocacy.",
                    website="https://ntfb.org",
                    contact="info@ntfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-96.8966, 32.7085]}, "properties": {"label": "4500 S Cockrell Hill Rd, Dallas, TX 75236", "provider": "seed"}}
                ),
                Charity(
                    username="sanjose_silicon",
                    password=hash_password("password123"),
                    name="Second Harvest Silicon Valley",
                    address="4001 N 1st St, San Jose, CA 95134",
                    description="Serving 500,000+ people in Silicon Valley with nutritious food each month.",
                    website="https://shfb.org",
                    contact="contact@shfb.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-121.9552, 37.4085]}, "properties": {"label": "4001 N 1st St, San Jose, CA 95134", "provider": "seed"}}
                ),
                Charity(
                    username="austin_pantry",
                    password=hash_password("password123"),
                    name="Central Texas Food Bank",
                    address="6500 Metropolis Dr, Austin, TX 78744",
                    description="Leading the community to nourish hungry people and feed healthy lives.",
                    website="https://centraltexasfoodbank.org",
                    contact="info@ctfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-97.7615, 30.2033]}, "properties": {"label": "6500 Metropolis Dr, Austin, TX 78744", "provider": "seed"}}
                ),
                Charity(
                    username="jacksonville_care",
                    password=hash_password("password123"),
                    name="Feeding Northeast Florida",
                    address="10710 Beaver St, Jacksonville, FL 32220",
                    description="Providing hope and nourishment to children, families, and seniors.",
                    website="https://feedingnefl.org",
                    contact="help@feedingnefl.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-81.7637, 30.2952]}, "properties": {"label": "10710 Beaver St, Jacksonville, FL 32220", "provider": "seed"}}
                ),
                Charity(
                    username="columbus_share",
                    password=hash_password("password123"),
                    name="Mid-Ohio Foodbank",
                    address="3960 Brookham Dr, Grove City, OH 43123",
                    description="Distributing food through 680 partner programs across 20 counties.",
                    website="https://mofc.org",
                    contact="contact@mofc.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-83.0792, 39.8614]}, "properties": {"label": "3960 Brookham Dr, Grove City, OH 43123", "provider": "seed"}}
                ),
                Charity(
                    username="fortworth_help",
                    password=hash_password("password123"),
                    name="Tarrant Area Food Bank",
                    address="2600 Cullen St, Fort Worth, TX 76107",
                    description="Providing access to nutritious food across 13 North Texas counties.",
                    website="https://tafb.org",
                    contact="info@tafb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-97.3545, 32.7357]}, "properties": {"label": "2600 Cullen St, Fort Worth, TX 76107", "provider": "seed"}}
                ),
                Charity(
                    username="charlotte_hope",
                    password=hash_password("password123"),
                    name="Second Harvest Charlotte",
                    address="500 Spratt St, Charlotte, NC 28206",
                    description="Feeding 19 counties in North and South Carolina through innovative programs.",
                    website="https://secondharvestmetrolina.org",
                    contact="contact@shmclt.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-80.8195, 35.2450]}, "properties": {"label": "500 Spratt St, Charlotte, NC 28206", "provider": "seed"}}
                ),
                Charity(
                    username="indy_food",
                    password=hash_password("password123"),
                    name="Gleaners Food Bank of Indiana",
                    address="3737 Waldemere Ave, Indianapolis, IN 46241",
                    description="Indiana's largest food bank, serving 21 counties with hunger relief.",
                    website="https://gleaners.org",
                    contact="info@gleaners.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-86.2379, 39.7524]}, "properties": {"label": "3737 Waldemere Ave, Indianapolis, IN 46241", "provider": "seed"}}
                ),
                Charity(
                    username="seattle_share",
                    password=hash_password("password123"),
                    name="Food Lifeline",
                    address="815 S 96th St, Seattle, WA 98108",
                    description="Rescuing food and delivering hope across Western Washington.",
                    website="https://foodlifeline.org",
                    contact="help@foodlifeline.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-122.2976, 47.5185]}, "properties": {"label": "815 S 96th St, Seattle, WA 98108", "provider": "seed"}}
                ),
                Charity(
                    username="denver_table",
                    password=hash_password("password123"),
                    name="Food Bank of the Rockies",
                    address="10700 E 45th Ave, Denver, CO 80239",
                    description="Providing nutritious food to Coloradans facing hunger.",
                    website="https://foodbankrockies.org",
                    contact="contact@fbr.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-104.8633, 39.7794]}, "properties": {"label": "10700 E 45th Ave, Denver, CO 80239", "provider": "seed"}}
                ),
                Charity(
                    username="nashville_mission",
                    password=hash_password("password123"),
                    name="Nashville Rescue Mission",
                    address="639 Lafayette St, Nashville, TN 37203",
                    description="Providing meals, shelter, and transformation for Nashville's homeless.",
                    website="https://nashvillerescuemission.org",
                    contact="info@nashvillerescuemission.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-86.7844, 36.1627]}, "properties": {"label": "639 Lafayette St, Nashville, TN 37203", "provider": "seed"}}
                ),
                Charity(
                    username="okc_regional",
                    password=hash_password("password123"),
                    name="Regional Food Bank of Oklahoma",
                    address="3355 S Purdue Ave, Oklahoma City, OK 73179",
                    description="Fighting hunger across 53 Oklahoma counties with food distribution programs.",
                    website="https://rfbo.org",
                    contact="contact@rfbo.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-97.5806, 35.4233]}, "properties": {"label": "3355 S Purdue Ave, Oklahoma City, OK 73179", "provider": "seed"}}
                ),
                Charity(
                    username="portland_pantry",
                    password=hash_password("password123"),
                    name="Oregon Food Bank",
                    address="7900 SE 6th Ave, Portland, OR 97202",
                    description="Building food security across Oregon and Southwest Washington.",
                    website="https://oregonfoodbank.org",
                    contact="info@ofb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-122.6587, 45.4640]}, "properties": {"label": "7900 SE 6th Ave, Portland, OR 97202", "provider": "seed"}}
                ),
                Charity(
                    username="vegas_harvest",
                    password=hash_password("password123"),
                    name="Three Square Food Bank",
                    address="4190 N Pecos Rd, Las Vegas, NV 89115",
                    description="Southern Nevada's only food bank, serving 400,000 people annually.",
                    website="https://threesquare.org",
                    contact="help@threesquare.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-115.1428, 36.2106]}, "properties": {"label": "4190 N Pecos Rd, Las Vegas, NV 89115", "provider": "seed"}}
                ),
                Charity(
                    username="detroit_gleaners",
                    password=hash_password("password123"),
                    name="Gleaners Community Food Bank",
                    address="2131 Beaufait St, Detroit, MI 48207",
                    description="Providing food, hope, and support to hungry people in Southeast Michigan.",
                    website="https://gcfb.org",
                    contact="contact@gcfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-83.0060, 42.3608]}, "properties": {"label": "2131 Beaufait St, Detroit, MI 48207", "provider": "seed"}}
                ),
                Charity(
                    username="memphis_food",
                    password=hash_password("password123"),
                    name="Mid-South Food Bank",
                    address="4025 NEPAL ST, Memphis, TN 38118",
                    description="Feeding the Mid-South through innovative hunger relief programs.",
                    website="https://midsouthfoodbank.org",
                    contact="info@midsouthfoodbank.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-90.0069, 35.0617]}, "properties": {"label": "4025 NEPAL ST, Memphis, TN 38118", "provider": "seed"}}
                ),
                Charity(
                    username="boston_share",
                    password=hash_password("password123"),
                    name="Greater Boston Food Bank",
                    address="70 South Bay Ave, Boston, MA 02118",
                    description="New England's largest hunger relief organization serving Eastern Massachusetts.",
                    website="https://gbfb.org",
                    contact="contact@gbfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-71.0656, 42.3363]}, "properties": {"label": "70 South Bay Ave, Boston, MA 02118", "provider": "seed"}}
                ),
                Charity(
                    username="baltimore_mission",
                    password=hash_password("password123"),
                    name="Maryland Food Bank",
                    address="2200 Halethorpe Farms Rd, Baltimore, MD 21227",
                    description="Leading the movement to end hunger throughout Maryland.",
                    website="https://mdfoodbank.org",
                    contact="help@mdfoodbank.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-76.6869, 39.2366]}, "properties": {"label": "2200 Halethorpe Farms Rd, Baltimore, MD 21227", "provider": "seed"}}
                ),
                Charity(
                    username="milwaukee_pantry",
                    password=hash_password("password123"),
                    name="Feeding America Eastern Wisconsin",
                    address="2911 W Saint Paul Ave, Milwaukee, WI 53208",
                    description="Fighting hunger across 35 Wisconsin counties.",
                    website="https://feedingamericawi.org",
                    contact="info@feedingwi.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-87.9535, 43.0637]}, "properties": {"label": "2911 W Saint Paul Ave, Milwaukee, WI 53208", "provider": "seed"}}
                ),
                Charity(
                    username="albuquerque_food",
                    password=hash_password("password123"),
                    name="Roadrunner Food Bank",
                    address="5840 Office Blvd NE, Albuquerque, NM 87109",
                    description="New Mexico's largest food bank, serving all 33 counties.",
                    website="https://rrfb.org",
                    contact="contact@rrfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-106.5713, 35.1241]}, "properties": {"label": "5840 Office Blvd NE, Albuquerque, NM 87109", "provider": "seed"}}
                ),
                Charity(
                    username="tucson_pantry",
                    password=hash_password("password123"),
                    name="Community Food Bank of Southern Arizona",
                    address="3003 S Country Club Rd, Tucson, AZ 85713",
                    description="Fighting hunger and building healthier communities in Southern Arizona.",
                    website="https://communityfoodbank.org",
                    contact="info@communityfoodbank.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-110.9447, 32.1961]}, "properties": {"label": "3003 S Country Club Rd, Tucson, AZ 85713", "provider": "seed"}}
                ),
                Charity(
                    username="atlanta_table",
                    password=hash_password("password123"),
                    name="Atlanta Community Food Bank",
                    address="732 Joseph E Lowery Blvd NW, Atlanta, GA 30318",
                    description="Fighting hunger throughout metro Atlanta and North Georgia.",
                    website="https://acfb.org",
                    contact="help@acfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-84.4193, 33.7660]}, "properties": {"label": "732 Joseph E Lowery Blvd NW, Atlanta, GA 30318", "provider": "seed"}}
                ),
                Charity(
                    username="fresno_help",
                    password=hash_password("password123"),
                    name="Community Food Bank Fresno",
                    address="4010 E Amendola Dr, Fresno, CA 93725",
                    description="Providing food assistance across six Central California counties.",
                    website="https://communityfoodbank.net",
                    contact="info@cfbf.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-119.7522, 36.7883]}, "properties": {"label": "4010 E Amendola Dr, Fresno, CA 93725", "provider": "seed"}}
                ),
                Charity(
                    username="sacramento_food",
                    password=hash_password("password123"),
                    name="Sacramento Food Bank & Family Services",
                    address="3333 3rd Ave, Sacramento, CA 95817",
                    description="Providing food, services, and advocacy for Sacramento's hungry.",
                    website="https://sacfoodbank.org",
                    contact="contact@sacfoodbank.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-121.4697, 38.5637]}, "properties": {"label": "3333 3rd Ave, Sacramento, CA 95817", "provider": "seed"}}
                ),
                Charity(
                    username="mesa_mission",
                    password=hash_password("password123"),
                    name="United Food Bank",
                    address="245 S Nina Dr, Mesa, AZ 85210",
                    description="Feeding hungry people throughout Arizona with dignity and compassion.",
                    website="https://unitedfoodbank.org",
                    contact="info@ufb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-111.7318, 33.4146]}, "properties": {"label": "245 S Nina Dr, Mesa, AZ 85210", "provider": "seed"}}
                ),
                Charity(
                    username="kansas_harvest",
                    password=hash_password("password123"),
                    name="Harvesters - Kansas City Food Bank",
                    address="3801 Topping Ave, Kansas City, MO 64129",
                    description="Feeding hungry people today and working to end hunger tomorrow.",
                    website="https://harvesters.org",
                    contact="contact@harvesters.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-94.5278, 39.0598]}, "properties": {"label": "3801 Topping Ave, Kansas City, MO 64129", "provider": "seed"}}
                ),
                Charity(
                    username="miami_rescue",
                    password=hash_password("password123"),
                    name="Feeding South Florida",
                    address="4925 Pembroke Rd, Pembroke Park, FL 33023",
                    description="Ending hunger in South Florida through food distribution and advocacy.",
                    website="https://feedingsouthflorida.org",
                    contact="help@feedingsfl.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-80.1716, 25.9868]}, "properties": {"label": "4925 Pembroke Rd, Pembroke Park, FL 33023", "provider": "seed"}}
                ),
                Charity(
                    username="omaha_pantry",
                    password=hash_password("password123"),
                    name="Food Bank for the Heartland",
                    address="10525 J St, Omaha, NE 68127",
                    description="Providing food assistance to Nebraska and Western Iowa families.",
                    website="https://foodbankheartland.org",
                    contact="info@fbh.org",
                    needs_donations=True,
                    needs_volunteers=False,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-96.1052, 41.2108]}, "properties": {"label": "10525 J St, Omaha, NE 68127", "provider": "seed"}}
                ),
                Charity(
                    username="long_beach_help",
                    password=hash_password("password123"),
                    name="Long Beach Rescue Mission",
                    address="1335 Pacific Ave, Long Beach, CA 90813",
                    description="Serving Long Beach's homeless with meals, shelter, and recovery programs.",
                    website="https://lbrm.org",
                    contact="contact@lbrm.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.1892, 33.7768]}, "properties": {"label": "1335 Pacific Ave, Long Beach, CA 90813", "provider": "seed"}}
                ),
                Charity(
                    username="oakland_share",
                    password=hash_password("password123"),
                    name="Alameda County Community Food Bank",
                    address="7900 Edgewater Dr, Oakland, CA 94621",
                    description="Working to end hunger in Alameda County through food distribution.",
                    website="https://accfb.org",
                    contact="info@accfb.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-122.2033, 37.7409]}, "properties": {"label": "7900 Edgewater Dr, Oakland, CA 94621", "provider": "seed"}}
                ),
                Charity(
                    username="minneapolis_table",
                    password=hash_password("password123"),
                    name="Second Harvest Heartland",
                    address="7101 Winnetka Ave N, Brooklyn Park, MN 55428",
                    description="Minnesota's largest hunger relief organization serving 59 counties.",
                    website="https://2harvest.org",
                    contact="contact@2harvest.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-93.3619, 45.1046]}, "properties": {"label": "7101 Winnetka Ave N, Brooklyn Park, MN 55428", "provider": "seed"}}
                ),
                Charity(
                    username="tulsa_mission",
                    password=hash_password("password123"),
                    name="Community Food Bank of Eastern Oklahoma",
                    address="2504 S Garnett Rd, Tulsa, OK 74129",
                    description="Fighting hunger in Eastern Oklahoma through food banking services.",
                    website="https://cfbeo.org",
                    contact="help@cfbeo.org",
                    needs_donations=True,
                    needs_volunteers=True,
                    is_approved=True,
                    geojson={"type": "Feature", "geometry": {"type": "Point", "coordinates": [-95.8977, 36.1308]}, "properties": {"label": "2504 S Garnett Rd, Tulsa, OK 74129", "provider": "seed"}}
                ),
            ]

            session.add_all(charities)
            await session.commit()

    # Create redis client and decode responses to strings
    # Note: decode_respones was a typo that prevented proper decoding
    app.state.redis = redis.from_url(REDIS_URL, decode_responses=True)

    try:
        yield
    finally:
        r = getattr(app.state, "redis", None)
        if r is not None:
            await r.aclose()
        await engine.dispose()






app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Parse FRONTEND_ORIGIN which may be a single origin or a comma-separated list.
# When a wildcard ("*") is provided, we must disable credentials because
# Access-Control-Allow-Origin: * is not allowed with Access-Control-Allow-Credentials: true.
_raw_frontend_origins = os.getenv("FRONTEND_ORIGIN", "*")
if _raw_frontend_origins.strip() == "*":
    # If wildcard, allow all origins but disable credentials (cookies won't work cross-origin)
    # However, if frontend and backend are same origin, we can allow credentials
    _allow_origins = ["*"]
    _allow_credentials = False
else:
    _allow_origins = [o.strip() for o in _raw_frontend_origins.split(",") if o.strip()]
    # Allow credentials when specific origins are set (needed for cookies)
    _allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug: log the CORS configuration at startup so we can confirm the rendered env was picked up
print(f"CORS configured. allow_origins={_allow_origins} allow_credentials={_allow_credentials}")
app.add_middleware(
    RateLimitMiddleware,
    limit=10,
    window=60,
    paths=["/charities/login"],  
)

# Include API routes first (before static files)
app.include_router(routes.router, tags=["notes"])

@app.get("/health")
async def health():
    try:
        pong = await app.state.redis.ping()
        return {"db": "ok", "redis": pong}
    except Exception as e:
        return {"db": "ok", "redis": False, "error": str(e)}

# Serve static files (JS, CSS, images, etc.) from the frontend build
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets (JS, CSS, etc.)
    static_dir = frontend_dist / "assets"
    if static_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(static_dir)), name="assets")
    
    # Note: Vite doesn't create a /static directory, so we don't mount it
    
    # Serve files from dist root (like vite.svg)
    @app.get("/vite.svg")
    async def serve_vite_svg():
        """Serve vite.svg from dist root"""
        svg_path = frontend_dist / "vite.svg"
        if svg_path.exists():
            return FileResponse(str(svg_path))
        raise HTTPException(status_code=404)
    
    # Catch-all route for SPA: serve index.html for any route that doesn't match API routes
    # This must be the last route to catch all unmatched paths
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        """
        Serve the React app for client-side routing.
        This catches all routes that don't match API endpoints or static files.
        """
        # Don't serve HTML for static assets, health check, or API routes
        if (full_path.startswith("assets/") or 
            full_path.startswith("static/") or
            full_path == "health" or
            full_path.startswith("api/") or
            full_path == "vite.svg" or
            full_path == "icon.svg"):
            raise HTTPException(status_code=404)
        
        # Check if this is an API request (Accept header prefers application/json)
        accept_header = request.headers.get("accept", "")
        if "application/json" in accept_header.lower() and "text/html" not in accept_header.lower():
            # This is likely an API request for a non-existent endpoint
            raise HTTPException(status_code=404)
        
        # Serve index.html for all other routes (SPA routing)
        index_path = frontend_dist / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")