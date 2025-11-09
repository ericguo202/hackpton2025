# NeverHunger: Combatting Food Insecurity in Our Communities
## Inspiration
As of this writing, the ongoing federal government shutdown is affecting the food security of 42 million people - one-eighth of the American population. During this difficult time, charities and volunteers have pledged to step up to make sure everyone has a stable access to food in their communities. 

## What it does
This app makes it easy for SNAP recipients, as well as other users facing food insecurity, to search for nearby food banks, philanthropies, and other local organizations that provide food assistance. These members of the public do not need to create an account, but navigate to the charities dashboard through a button on the homepage. Meanwhile, organizations can register and provide their location, website, and contact information. The locations of these charities will be displayed on a map. There is also a volunteer dashboard for members of the community who want to help provide food assistance. The volunteer dashboard page will also have a map but with different information about each charity displayed: instead of vital information for finding charities, this map will display charities color-coded based on their needs (needs volunteers, donations, or both). 

## How we built it
For the backend, we decided to use FastAPI paired with Redis and Postgres containers. For the frontend, we decided to use a Typescript-based React Vite template and also use Tailwind CSS for the styling. First, we decided to implement the Charities model in our database and construct a RESTful API with CRUD functionality for charities. After deciding on the DB schema and routing structure as a team, we split up with setting up the frontend and backend dependencies and functionalities. We used two routers: React Router on the frontend which serves pages, as well as an API router on the backend that provides JSON data. We first decided to set up basic forms for logging in and registering, and tested those routes by connecting the frontend. After getting those to work, we focused on getting our core functionality in: the map. For our team, this was probably our most ambitious feature, as none of us had worked with GeoJSON before. We implemented geocoding in the backend, which was used by the frontend to render charities on the map.

We used Cursor's AI Agents, Claude Sonnet 4.5, and ChatGPT 5 to write, edit, and review our code. We have reviewed all of our code and have a record of our AI use.

## Challenges we ran into
First, when we were using AI as a copilot for installing Tailwind, the agent only knew of Tailwind v3, instead of the newer Tailwind v4. So, its instructions for installing Tailwind led to several errors. We resolved these errors by looking at the new documentation and implementing Tailwind ourselves.

Sometimes, the Redis cache would persist even after an edit had been made in the database. The cache would display stored data that wasn't true at the time. We solved this by using Redis: names and implementing a version counter that updated upon changes to the database. We also had several merge conflicts and several issues with environment variables, as well as CORS issues. However, we remained level-headed and resolved all of those issues through reading the code or AI prompt engineering (asking an AI agent to grep all project files and suggest potential bug causes).

## Accomplishments that we're proud of
A cool feature that we implemented is zooming in the map based on a zip code input, so users can find charities local to them without scrolling for a long time using the map. Another cool feature that we're proud of is using the Mapbox Searchbox API to autocomplete address suggestions in the registration form based on user input. This helps validate that addresses are legitimate while also saving users time when registering their charity. Finally, we're proud of the dynamic navbars and homepage which renders different components based on if a user (charity) is logged in or if a member of the public (not logged in) is using the application.

## What we learned
Using Artificial Intelligence as a coding copilot is a useful tool and a great way to increase productivity. However, we found it very important to understand the underlying concepts and components of our program. For example, we needed a clear outline of our routing and JSON bodies, so at the start we discussed them as a team and drew up DB schemas and routing structures. We also learned that prompt engineering is a crucial skill to maximize productivity. One must know what they actually envision and communicate that clearly to the AI agent in order for the agent to produce what they want. Finally, sometimes AI agents are not the most up-to-date with documentation, so the ability to read and understand documentation remains vital.

We also learned a lot about using Git and Github. Matt and Eric are first-time hackathon participants, and this is David's second hackathon. Neither of us had been well-versed in using Git version control previously, but we learned a lot on the spot (mostly through trial and error). Now, we feel a lot more confident committing, stashing, and pushing our code while also resolving merge conflicts and reviewing pull requests. 

## What's next for NeverHunger
- Allow volunteers to create accounts so volunteers can "follow" charities and be emailed about charity updates
- More information stored about charities, such as opening hours or special community events. These information will be displayed both on the map and the charity page.
- AI agent that checks if a charity website is legitimate (helps with site security)

# Acknowledgements

**Libraries, Frameworks, and Tools Used:**

- FastAPI
- React (with Vite)
- TailwindCSS
- Mapbox
- Redis
- Docker Compose
- PostgresSQL
- Vite

**AI Disclosure:** We used Cursor's AI Agents, Claude Sonnet 4.5, and ChatGPT 5 to write, edit, and review our code. We have reviewed all of our code and have a record of our AI use.
