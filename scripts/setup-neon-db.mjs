import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_sR7xl3qkKFgU@ep-sweet-base-b5gc16h2-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(databaseUrl);

async function setupDatabase() {
  console.log('Connecting to Neon database and setting up schema...');

  // 1. worker_profiles table
  await sql`
    CREATE TABLE IF NOT EXISTS worker_profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      nationality TEXT NOT NULL,
      birth_date TEXT,
      age INTEGER,
      gender TEXT,
      religion TEXT,
      marital_status TEXT,
      children INTEGER DEFAULT 0,
      experience_years INTEGER DEFAULT 0,
      experience_country TEXT,
      availability TEXT DEFAULT 'Available',
      skills TEXT[] DEFAULT '{}',
      portrait_data TEXT,
      passport_data TEXT,
      passport_number TEXT,
      fee_sar NUMERIC DEFAULT 14500,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Created worker_profiles table');

  // 2. country_fee_settings table
  await sql`
    CREATE TABLE IF NOT EXISTS country_fee_settings (
      country TEXT PRIMARY KEY,
      fee_sar NUMERIC NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Created country_fee_settings table');

  // 3. user_roles table
  await sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Created user_roles table');

  // 4. worker_requests table
  await sql`
    CREATE TABLE IF NOT EXISTS worker_requests (
      id BIGSERIAL PRIMARY KEY,
      worker_id TEXT,
      sponsor_email TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Created worker_requests table');

  // 5. app_users table
  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sponsor',
      language TEXT DEFAULT 'en',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Created app_users table');

  // Seed default country fee settings
  const defaultFeeSettings = [
    { country: 'The Philippines', fee_sar: 14750 },
    { country: 'Indonesia', fee_sar: 15500 },
    { country: 'Sri Lanka', fee_sar: 13800 },
    { country: 'Kenya', fee_sar: 9800 },
    { country: 'Uganda', fee_sar: 8500 },
    { country: 'Ethiopia', fee_sar: 7500 },
    { country: 'India', fee_sar: 12500 },
    { country: 'Bangladesh', fee_sar: 11200 },
    { country: 'Burundi', fee_sar: 8900 },
    { country: 'Ghana', fee_sar: 9200 },
    { country: 'Rwanda', fee_sar: 8800 },
    { country: 'Tanzania', fee_sar: 9400 },
    { country: 'Sudan', fee_sar: 10500 },
    { country: 'Egypt', fee_sar: 11000 },
    { country: 'Uzbekistan', fee_sar: 16500 },
    { country: 'Thailand', fee_sar: 17000 },
    { country: 'Malaysia', fee_sar: 16000 },
    { country: 'Pakistan', fee_sar: 10000 },
    { country: 'Yemen', fee_sar: 9500 },
  ];

  for (const item of defaultFeeSettings) {
    await sql`
      INSERT INTO country_fee_settings (country, fee_sar, updated_at)
      VALUES (${item.country}, ${item.fee_sar}, NOW())
      ON CONFLICT (country) DO UPDATE 
      SET fee_sar = EXCLUDED.fee_sar, updated_at = NOW()
    `;
  }
  console.log('✓ Seeded country_fee_settings');

  // Seed default demo workers
  const demoWorkers = [
    {
      id: 'wp-1',
      full_name: 'Maria Santos',
      job_title: 'Domestic Worker',
      nationality: 'The Philippines',
      birth_date: '1998-05-14',
      age: 28,
      gender: 'Female',
      religion: 'Christianity',
      marital_status: 'Married',
      children: 2,
      experience_years: 4,
      availability: 'Available',
      skills: ['Cooking', 'Childcare', 'Cleaning & organization'],
      passport_number: 'P8921445',
      fee_sar: 14750
    },
    {
      id: 'wp-2',
      full_name: 'Siti Rahmawati',
      job_title: 'Housekeeper',
      nationality: 'Indonesia',
      birth_date: '1994-02-18',
      age: 32,
      gender: 'Female',
      religion: 'Islam',
      marital_status: 'Married',
      children: 1,
      experience_years: 5,
      availability: 'Available',
      skills: ['Cooking', 'Cleaning & organization', 'Elderly care'],
      passport_number: 'A4892011',
      fee_sar: 15500
    },
    {
      id: 'wp-3',
      full_name: 'Amina Mwangi',
      job_title: 'Childcare Worker',
      nationality: 'Kenya',
      birth_date: '2000-08-22',
      age: 26,
      gender: 'Female',
      religion: 'Christianity',
      marital_status: 'Single',
      children: 0,
      experience_years: 3,
      availability: 'Available',
      skills: ['Childcare', 'Cooking'],
      passport_number: 'AK992014',
      fee_sar: 9800
    },
    {
      id: 'wp-4',
      full_name: 'Rajesh Kumar',
      job_title: 'Driver',
      nationality: 'India',
      birth_date: '1991-11-03',
      age: 35,
      gender: 'Male',
      religion: 'Hinduism',
      marital_status: 'Married',
      children: 2,
      experience_years: 7,
      availability: 'Available',
      skills: ['Cleaning & organization'],
      passport_number: 'Z1892004',
      fee_sar: 12500
    },
    {
      id: 'wp-5',
      full_name: 'Fatima Al-Hassan',
      job_title: 'Cook',
      nationality: 'Ethiopia',
      birth_date: '1997-04-12',
      age: 29,
      gender: 'Female',
      religion: 'Islam',
      marital_status: 'Single',
      children: 0,
      experience_years: 4,
      availability: 'In process',
      skills: ['Cooking', 'Cleaning & organization'],
      passport_number: 'ET771239',
      fee_sar: 7500
    },
    {
      id: 'wp-6',
      full_name: 'Kavitha Perera',
      job_title: 'Domestic Worker',
      nationality: 'Sri Lanka',
      birth_date: '1996-09-09',
      age: 30,
      gender: 'Female',
      religion: 'Buddhism',
      marital_status: 'Married',
      children: 1,
      experience_years: 5,
      availability: 'Available',
      skills: ['Cooking', 'Elderly care', 'Childcare'],
      passport_number: 'N5521990',
      fee_sar: 13800
    }
  ];

  for (const w of demoWorkers) {
    await sql`
      INSERT INTO worker_profiles (
        id, full_name, job_title, nationality, birth_date, age, gender, religion,
        marital_status, children, experience_years, availability, skills, passport_number, fee_sar
      ) VALUES (
        ${w.id}, ${w.full_name}, ${w.job_title}, ${w.nationality}, ${w.birth_date}, ${w.age},
        ${w.gender}, ${w.religion}, ${w.marital_status}, ${w.children}, ${w.experience_years},
        ${w.availability}, ${w.skills}, ${w.passport_number}, ${w.fee_sar}
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        job_title = EXCLUDED.job_title,
        nationality = EXCLUDED.nationality,
        birth_date = EXCLUDED.birth_date,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        religion = EXCLUDED.religion,
        marital_status = EXCLUDED.marital_status,
        children = EXCLUDED.children,
        experience_years = EXCLUDED.experience_years,
        availability = EXCLUDED.availability,
        skills = EXCLUDED.skills,
        passport_number = EXCLUDED.passport_number,
        fee_sar = EXCLUDED.fee_sar,
        updated_at = NOW()
    `;
  }
  console.log('✓ Seeded worker_profiles');

  // Seed demo app users & roles
  const demoUsers = [
    {
      id: 'usr_superadmin',
      email: 'superadmin@demo.local',
      password: 'DemoAdmin!2026',
      role: 'super_admin'
    },
    {
      id: 'usr_admin',
      email: 'admin@demo.local',
      password: 'DemoAdmin!2026',
      role: 'admin'
    },
    {
      id: 'usr_sponsor',
      email: 'sponsor@demo.local',
      password: 'DemoSponsor!2026',
      role: 'sponsor'
    },
    {
      id: 'usr_director',
      email: 'director@fanfaisal.sa',
      password: 'DemoAdmin!2026',
      role: 'super_admin'
    },
    {
      id: 'usr_fanfaisal_admin',
      email: 'admin@fanfaisal.sa',
      password: 'DemoAdmin!2026',
      role: 'admin'
    },
    {
      id: 'usr_fanfaisal_sponsor',
      email: 'sponsor@fanfaisal.sa',
      password: 'DemoSponsor!2026',
      role: 'sponsor'
    }
  ];

  for (const u of demoUsers) {
    await sql`
      INSERT INTO app_users (id, email, password, role)
      VALUES (${u.id}, ${u.email}, ${u.password}, ${u.role})
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        updated_at = NOW()
    `;

    await sql`
      INSERT INTO user_roles (user_id, role, updated_at)
      VALUES (${u.email}, ${u.role}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW()
    `;
  }
  console.log('✓ Seeded app_users and user_roles');

  console.log('\n🎉 Neon Database setup and seeding completed successfully!');
}

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
