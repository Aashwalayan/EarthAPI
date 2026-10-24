import {
  getCountries,
  getStatesOfCountry,
  getCitiesOfState,
} from '@countrystatecity/countries';

const countries = await getCountries();

console.log('\n=== COUNTRIES ===');
console.log('Total:', countries.length);
console.log('Sample:', countries.slice(0, 3));

const india = countries.find(
  (country) => country.iso2 === 'IN'
);

console.log('\n=== INDIA ===');
console.log(india);

const states = await getStatesOfCountry('IN');

console.log('\n=== INDIAN STATES ===');
console.log('Total:', states.length);
console.log('Sample:', states.slice(0, 3));

const chhattisgarh = states.find(
  (state) => state.name === 'Chhattisgarh'
);

console.log('\n=== CHHATTISGARH ===');
console.log(chhattisgarh);

if (chhattisgarh) {
  const cities = await getCitiesOfState('IN', chhattisgarh.iso2);

  console.log('\n=== CHHATTISGARH CITIES ===');
  console.log('Total:', cities.length);
  console.log('Sample:', cities.slice(0, 10));
}