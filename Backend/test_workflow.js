const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  try {
    console.log('--- STARTING E2E TEST ---');
    
    // 1. Camper Login
    console.log('\n1. Logging in as camper...');
    const camperRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'camper4@gmail.com',
      password: 'Camper@4'
    });
    const camperToken = camperRes.data.token;
    console.log('Camper login successful. Token received.');

    // 2. Fetch Camps
    console.log('\n2. Fetching camps...');
    const campsRes = await axios.get(`${BASE_URL}/camps`);
    const camp = campsRes.data.data[0];
    if (!camp) throw new Error('No camps found');
    console.log(`Found camp: ${camp.name} (ID: ${camp._id})`);

    // 3. Fetch Tents for Camp
    console.log('\n3. Fetching tents...');
    const tentsRes = await axios.get(`${BASE_URL}/tents/camp/${camp._id}`);
    const tent = tentsRes.data.data[0];
    if (!tent) throw new Error('No tents found in this camp');
    console.log(`Found tent: ${tent.name} (ID: ${tent._id})`);

    // 4. Create Booking
    console.log('\n4. Creating booking...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
      campId: camp._id,
      tentId: tent._id,
      checkIn: tomorrow.toISOString().split('T')[0],
      checkOut: nextDay.toISOString().split('T')[0],
      guests: 2,
      amount: tent.pricePerNight // 1 night
    }, {
      headers: { Authorization: `Bearer ${camperToken}` }
    });
    const booking = bookingRes.data.data;
    console.log(`Booking created successfully! Reservation Code: ${booking.reservationCode}`);

    console.log('\n--- ALL E2E TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    console.error(error.response ? error.response.data : error.message);
  }
}

runTest();
