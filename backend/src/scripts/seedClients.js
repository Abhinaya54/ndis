const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Client = require('../models/Client');

const dummyClients = [
  {
    name: 'Sarah Thompson',
    email: 'sarah.thompson@email.com',
    phone: '0412 345 678',
    address: '12 Harbour St, Sydney NSW 2000',
    room: 'A101',
    careLevel: 'High',
    ndisNumber: 'NDIS-4301234567',
    dateOfBirth: new Date('1958-03-15'),
    emergencyContact: 'John Thompson - 0498 765 432',
    notes: 'Requires wheelchair assistance. Prefers morning visits.',
    isActive: true
  },
  {
    name: 'James Mitchell',
    email: 'james.mitchell@email.com',
    phone: '0423 456 789',
    address: '45 King William Rd, Adelaide SA 5000',
    room: 'B203',
    careLevel: 'Medium',
    ndisNumber: 'NDIS-4302345678',
    dateOfBirth: new Date('1972-07-22'),
    emergencyContact: 'Lisa Mitchell - 0487 654 321',
    notes: 'Allergic to penicillin. Independent with daily tasks.',
    isActive: true
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@email.com',
    phone: '0434 567 890',
    address: '78 Brunswick St, Fitzroy VIC 3065',
    room: 'C105',
    careLevel: 'Low',
    ndisNumber: 'NDIS-4303456789',
    dateOfBirth: new Date('1990-11-08'),
    emergencyContact: 'Wei Chen - 0476 543 210',
    notes: 'Attends weekly physiotherapy sessions on Tuesdays.',
    isActive: true
  },
  {
    name: 'Robert Williams',
    email: 'robert.williams@email.com',
    phone: '0445 678 901',
    address: '23 James St, Fortitude Valley QLD 4006',
    room: 'A204',
    careLevel: 'High',
    ndisNumber: 'NDIS-4304567890',
    dateOfBirth: new Date('1945-01-30'),
    emergencyContact: 'Margaret Williams - 0465 432 109',
    notes: 'Vision impaired. Requires assistance with medication management.',
    isActive: true
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '0456 789 012',
    address: '56 Beaufort St, Perth WA 6000',
    room: 'B110',
    careLevel: 'Medium',
    ndisNumber: 'NDIS-4305678901',
    dateOfBirth: new Date('1985-09-12'),
    emergencyContact: 'Raj Sharma - 0454 321 098',
    notes: 'Vegetarian diet. Enjoys art therapy programs.',
    isActive: true
  },
  {
    name: 'David O\'Brien',
    email: 'david.obrien@email.com',
    phone: '0467 890 123',
    address: '89 Sandy Bay Rd, Hobart TAS 7005',
    room: 'C302',
    careLevel: 'Low',
    ndisNumber: 'NDIS-4306789012',
    dateOfBirth: new Date('1998-04-25'),
    emergencyContact: 'Karen O\'Brien - 0443 210 987',
    notes: 'Participates in community access programs three times a week.',
    isActive: true
  },
  {
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@email.com',
    phone: '0478 901 234',
    address: '34 Lonsdale St, Melbourne VIC 3000',
    room: 'A108',
    careLevel: 'High',
    ndisNumber: 'NDIS-4307890123',
    dateOfBirth: new Date('1962-12-03'),
    emergencyContact: 'Carlos Gonzalez - 0432 109 876',
    notes: 'Spanish-speaking. Requires interpreter for medical appointments.',
    isActive: true
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone: '0489 012 345',
    address: '67 Hindley St, Adelaide SA 5000',
    room: 'B215',
    careLevel: 'Medium',
    ndisNumber: 'NDIS-4308901234',
    dateOfBirth: new Date('1978-06-18'),
    emergencyContact: 'Susan Brown - 0421 098 765',
    notes: 'Uses hearing aids. Prefers written communication.',
    isActive: true
  },
  {
    name: 'Aisha Patel',
    email: 'aisha.patel@email.com',
    phone: '0490 123 456',
    address: '12 Northbourne Ave, Canberra ACT 2601',
    room: 'C201',
    careLevel: 'Low',
    ndisNumber: 'NDIS-4309012345',
    dateOfBirth: new Date('1995-02-14'),
    emergencyContact: 'Hassan Patel - 0410 987 654',
    notes: 'Pursuing supported employment. Good progress with life skills.',
    isActive: true
  },
  {
    name: 'Thomas Anderson',
    email: 'thomas.anderson@email.com',
    phone: '0401 234 567',
    address: '91 Mitchell St, Darwin NT 0800',
    room: 'A305',
    careLevel: 'High',
    ndisNumber: 'NDIS-4310123456',
    dateOfBirth: new Date('1950-08-07'),
    emergencyContact: 'Helen Anderson - 0499 876 543',
    notes: 'Requires 24-hour support. Has a service dog named Max.',
    isActive: true
  }
];

async function seedClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const inserted = await Client.insertMany(dummyClients);
    console.log(`Successfully added ${inserted.length} dummy clients:`);
    inserted.forEach(c => console.log(`  - ${c.name} (${c.ndisNumber}) [${c.careLevel}]`));

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error seeding clients:', err.message);
    process.exit(1);
  }
}

seedClients();
