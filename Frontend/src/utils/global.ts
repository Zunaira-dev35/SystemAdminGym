export interface ZoneData {
  id: number;
  name: string;
  tripRequestVolume: string;
  is_extra_fare_active: boolean;
  base_fare: number;
  is_active: boolean;
  created_at?: string;
  coordinates?: any[];
  updated_at?: string;
}
export interface UserInformation {
  id: number;
  user_id: number;
  dob: string | null;
  gender: string | null;
  residential_address: string | null;
  id_number: string | null;
  passport_number: string | null;
  license_number: string | null;
  license_expiry_date: string | null;
  license_type: string | null;
  id_front_pic: string | null;
  id_back_pic: string | null;
  driving_license_front: string | null;
  driving_license_back: string | null;
  passport_front: string | null;
  passport_back: string | null;
  other_doc_pic: string | null;
  salary: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  iban: string | null;
  swift_code: string | null;
  account_type: string | null;
  bank_branch: string | null;
  bank_address: string | null;
  payment_method_reference: string | null;
  emergency_contact_name: string | null;
  emergency_phone: string | null;
  years_of_experience: string | null;
  language_spoken: string | any;
  created_at: string;
  updated_at: string;
}


export interface Driver {
  id: number;
  google_id: string | null;
  user_type: string;
  identity_type: string;
  name: string;
  last_name: string;
  username: string;
  email: string;
  email_verified_at: string | null;
  is_active: number;
  profile_pic: string;
  city: string;
  location: string;
  reason: string | null;
  reference_num: string;
  type: string | null;
  role_id: number;
  created_at: string;
  updated_at: string;
  phone: string;
  phone_otp: number | null;
  latitude: number | null;
  longitude: number | null;
  stripe_customer_id: string | null;
  signin_type: string | null;
  otp_submit_attempts: number | null;
  otp_blocked_until: string | null;
  otp_last_sent_at: string | null;
  login_attempts: number | null;
  login_blocked_until: string | null;
  total_rides: number;
  user_information?: UserInformation;
}
export interface Customer {
  id: string;
  google_id: string | null;
  user_type: string;
  identity_type: string | null;
  name: string;
  last_name: string | null;
  username: string | null;
  email: string;
  email_verified_at: string | null;
  is_active: number;
  profile_pic: string | null;
  city: string | null;
  location: string | null;
  reason: string | null;
  reference_num: string;
  type: string | null;
  role_id: number;
  created_at: string;
  updated_at: string;
  phone: string;
  phone_otp: number | null;
  latitude: number | null;
  longitude: number | null;
  stripe_customer_id: string | null;
  signin_type: string;
  otp_submit_attempts: number | null;
  otp_blocked_until: string | null;
  otp_last_sent_at: string | null;
  login_attempts: number | null;
  login_blocked_until: string | null;
  total_rides: number;
}

export interface Employee {
  id: number;
  google_id: string | null;
  user_type: string;
  identity_type: string | null;
  name: string;
  last_name: string | null;
  username: string | null;
  email: string;
  email_verified_at: string | null;
  is_active: number;
  profile_pic: string;
  reference_num: string;
  device_fcm_token: string | null;
  type: string | null;
  role_id: number;
  created_at: string | null;
  updated_at: string | null;
  phone: string;
  phone_otp: number | null;
  latitude: number | null;
  longitude: number | null;
  stripe_customer_id: string | null;
  signin_type: string | null;
  otp_submit_attempts: number | null;
  otp_blocked_until: string | null;
  otp_last_sent_at: string | null;
  login_attempts: number | null;
  login_blocked_until: string | null;
  user_apple_identifier: string | null;
  add_as_employee: number;
  employee_shift_id: number;
  joining_date: string;
  customer_average_rating: number;
  system_currency: string;
  customer_wallet_balance: number;
  system_maintenance_mode: boolean;
  completed_rides: number;
  active_assignments: any[]; // or define a specific type if needed
  role_group_id?: any; // or define a specific type if needed

  // Nested relations
  roles: Array<{
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    pivot: {
      model_type: string;
      model_id: number;
      role_id: number;
    };
  }>;

  employee_shift: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
    inactive_date: string | null;
    inactive_reason: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface FleetCategoryType {
  id: number;
  name: string;
  description: string;
  image: string;
  status: string;
}
export interface FleetI {
  id: number;
  reference_num: string;
  driver_id: number | null;
  category_id: number;
  company_name: string;
  model: string;
  license_plate: string;
  status: string;
  active_status: string;
  insurance_expiry: string;
  registration_doc: string[];
  fleet_pictures: string[];
  created_at: string;
  updated_at: string;
  category_name: string;
  fleet_images: string[];
  registration_docs: string[];
  category_image: string;
  expected_min_fuel_efficiency_km_per_liter: string;
  fuel_capacity_liters: string;
}
export interface ShiftFleet{
  id: number,
  driver_id: number,
  fleet_id: number,
  shift_id: number,
  status: string,
  assignment_type: string,
  start_date: string,
  end_date: string,
  temporary_assignment_start_time: string,
  temporary_assignment_end_time: string,
  created_at: string,
  updated_at: string,
  fleet: {
      id: 1,
      reference_num: string,
      driver_id: null,
      category_id: 1,
      company_name: string
      model: string,
        fleet_category:{
          id: number,
          name: string
        },
  },
  driver: {
    id: number,
    name: string,
    last_name: string,
    username: string,
    email: string,
    is_active: number,
    profile_pic: string,
    created_at: string,
  },
  shift: {
    id: number,
    name: string,
    start_time: string,
    end_time: string,
    status: string,
    created_at: string,
    updated_at: string,
  }
}

export interface ShiftChangeI{
  id: number,
  name: string,
  userId: number,
  driver_id: number,
  fleet_id: number,
  shift_id: number,
  status: string,
  start_date: string,
  end_date: string,
  created_at: string,
  updated_at: string,
  apply_date: string,
  complete_date: string,
  fleet: {
      id: 1,
      reference_num: string,
      driver_id: null,
      category_id: 1,
      company_name: string
      model: string,
        fleet_category:{
          id: number,
          name: string
        },
  },
  driver: {
    id: number,
    name: string,
    last_name: string,
    username: string,
    email: string,
    is_active: number,
    profile_pic: string,
    created_at: string,
  },
  shift: {
    id: number,
    name: string,
    start_time: string,
    end_time: string,
    status: string,
    created_at: string,
    updated_at: string,
  },
  current_shift: {
    id: number,
    name: string,
    start_time: string,
    end_time: string,
    status: string,
    created_at: string,
    updated_at: string,
  },
  requested_shift: {
    id: number,
    name: string,
    start_time: string,
    end_time: string,
    status: string,
    created_at: string,
    updated_at: string,
  },
  current_fleet: {
      id: 1,
      reference_num: string,
      driver_id: null,
      category_id: 1,
      company_name: string
      model: string,
        fleet_category:{
          id: number,
          name: string
        },
  },
}
export interface ShiftI{
  id: number,
  name: string,
  start_time: string,
  end_time: string,
  status: string,
  inactive_date: string,
  inactive_reason: string,
  created_at: string,
  updated_at: string
}
export interface RideI {
  id: number;
  reference_num: string;
  customer_id: number;
  stripe_payment_method_id: string;
  stripe_payment_intent_id: string;
  driver_id: number;
  fleet_category_id: number;
  fleet_id: number;
  from_location: string;
  to_location: string;
  from_location_lat: number;
  from_location_lng: number;
  to_location_lat: number;
  to_location_lng: number;
  stop_locations: [StopLocations] | null;
  ride_type: string;
  rider_type: string;
  rider_contact_id: number | null;
  ride_status: string;
  ride_date: string;
  ride_time: string;
  total_distance_km: number;
  total_driving_time_min: number;
  total_waiting_time_min: number;
  base_fare: number;
  per_km_rate: number;
  driving_per_min_rate: number;
  waiting_per_min_rate: number;
  zone_id: number;
  zone_fare: number;
  tax_per: number;
  discount_per: number;
  stay_fare: number;
  ride_fare: number;
  tax_amount: number;
  discount_amount: number;
  total_fare: number;
  payment_currency: string;
  payment_status: string;
  driver_notes: string | null;
  applied_reward_type: string | null;
  loyalty_points_deduction: number | null;
  loyalty_discount_percent: number | null;
  loyalty_discount_amount: number | null;
  created_at: string;
  updated_at: string;
  driver: Driver;
  customer: Customer;
  fleet: FleetI;
  feedbacks: any;
}
export interface StopLocations{
  lat: number, 
  lng: number,
  location: string, 
  stay: string
}
export interface RideActivityLog {
  id: number;
  ride_id: number;
  ride_status: string;
  ride_status_time: string;
  reason: string | null;
  updated_by_type: string;
  updated_by_id: number;
  cancel_deduct_per: number | null;
  cancel_deduct_amount: number | null;
  created_at: string;
  updated_at: string;
}


export const timeZoneList = [
  {
    "id": 1,
    "name": "Africa/Abidjan"
  },
  {
    "id": 2,
    "name": "Africa/Accra"
  },
  {
    "id": 3,
    "name": "Africa/Addis Ababa"
  },
  {
    "id": 4,
    "name": "Africa/Algiers"
  },
  {
    "id": 5,
    "name": "Africa/Asmara"
  },
  {
    "id": 6,
    "name": "Africa/Bamako"
  },
  {
    "id": 7,
    "name": "Africa/Bangui"
  },
  {
    "id": 8,
    "name": "Africa/Banjul"
  },
  {
    "id": 9,
    "name": "Africa/Bissau"
  },
  {
    "id": 10,
    "name": "Africa/Blantyre"
  },
  {
    "id": 11,
    "name": "Africa/Brazzaville"
  },
  {
    "id": 12,
    "name": "Africa/Bujumbura"
  },
  {
    "id": 13,
    "name": "Africa/Cairo"
  },
  {
    "id": 14,
    "name": "Africa/Casablanca"
  },
  {
    "id": 15,
    "name": "Africa/Ceuta"
  },
  {
    "id": 16,
    "name": "Africa/Conakry"
  },
  {
    "id": 17,
    "name": "Africa/Dakar"
  },
  {
    "id": 18,
    "name": "Africa/Dar es Salaam"
  },
  {
    "id": 19,
    "name": "Africa/Djibouti"
  },
  {
    "id": 20,
    "name": "Africa/Douala"
  },
  {
    "id": 21,
    "name": "Africa/El Aaiun"
  },
  {
    "id": 22,
    "name": "Africa/Freetown"
  },
  {
    "id": 23,
    "name": "Africa/Gaborone"
  },
  {
    "id": 24,
    "name": "Africa/Harare"
  },
  {
    "id": 25,
    "name": "Africa/Johannesburg"
  },
  {
    "id": 26,
    "name": "Africa/Juba"
  },
  {
    "id": 27,
    "name": "Africa/Kampala"
  },
  {
    "id": 28,
    "name": "Africa/Khartoum"
  },
  {
    "id": 29,
    "name": "Africa/Kigali"
  },
  {
    "id": 30,
    "name": "Africa/Kinshasa"
  },
  {
    "id": 31,
    "name": "Africa/Lagos"
  },
  {
    "id": 32,
    "name": "Africa/Libreville"
  },
  {
    "id": 33,
    "name": "Africa/Lome"
  },
  {
    "id": 34,
    "name": "Africa/Luanda"
  },
  {
    "id": 35,
    "name": "Africa/Lubumbashi"
  },
  {
    "id": 36,
    "name": "Africa/Lusaka"
  },
  {
    "id": 37,
    "name": "Africa/Malabo"
  },
  {
    "id": 38,
    "name": "Africa/Maputo"
  },
  {
    "id": 39,
    "name": "Africa/Maseru"
  },
  {
    "id": 40,
    "name": "Africa/Mbabane"
  },
  {
    "id": 41,
    "name": "Africa/Mogadishu"
  },
  {
    "id": 42,
    "name": "Africa/Monrovia"
  },
  {
    "id": 43,
    "name": "Africa/Nairobi"
  },
  {
    "id": 44,
    "name": "Africa/Ndjamena"
  },
  {
    "id": 45,
    "name": "Africa/Niamey"
  },
  {
    "id": 46,
    "name": "Africa/Nouakchott"
  },
  {
    "id": 47,
    "name": "Africa/Ouagadougou"
  },
  {
    "id": 48,
    "name": "Africa/Porto-Novo"
  },
  {
    "id": 49,
    "name": "Africa/Sao Tome"
  },
  {
    "id": 50,
    "name": "Africa/Tripoli"
  },
  {
    "id": 51,
    "name": "Africa/Tunis"
  },
  {
    "id": 52,
    "name": "Africa/Windhoek"
  },
  {
    "id": 53,
    "name": "America/Adak"
  },
  {
    "id": 54,
    "name": "America/Anchorage"
  },
  {
    "id": 55,
    "name": "America/Anguilla"
  },
  {
    "id": 56,
    "name": "America/Antigua"
  },
  {
    "id": 57,
    "name": "America/Araguaina"
  },
  {
    "id": 58,
    "name": "America/Argentina/Buenos Aires"
  },
  {
    "id": 59,
    "name": "America/Argentina/Catamarca"
  },
  {
    "id": 60,
    "name": "America/Argentina/Cordoba"
  },
  {
    "id": 61,
    "name": "America/Argentina/Jujuy"
  },
  {
    "id": 62,
    "name": "America/Argentina/La Rioja"
  },
  {
    "id": 63,
    "name": "America/Argentina/Mendoza"
  },
  {
    "id": 64,
    "name": "America/Argentina/Rio Gallegos"
  },
  {
    "id": 65,
    "name": "America/Argentina/Salta"
  },
  {
    "id": 66,
    "name": "America/Argentina/San Juan"
  },
  {
    "id": 67,
    "name": "America/Argentina/San Luis"
  },
  {
    "id": 68,
    "name": "America/Argentina/Tucuman"
  },
  {
    "id": 69,
    "name": "America/Argentina/Ushuaia"
  },
  {
    "id": 70,
    "name": "America/Aruba"
  },
  {
    "id": 71,
    "name": "America/Asuncion"
  },
  {
    "id": 72,
    "name": "America/Atikokan"
  },
  {
    "id": 73,
    "name": "America/Bahia"
  },
  {
    "id": 74,
    "name": "America/Bahia Banderas"
  },
  {
    "id": 75,
    "name": "America/Barbados"
  },
  {
    "id": 76,
    "name": "America/Belem"
  },
  {
    "id": 77,
    "name": "America/Belize"
  },
  {
    "id": 78,
    "name": "America/Blanc-Sablon"
  },
  {
    "id": 79,
    "name": "America/Boa Vista"
  },
  {
    "id": 80,
    "name": "America/Bogota"
  },
  {
    "id": 81,
    "name": "America/Boise"
  },
  {
    "id": 82,
    "name": "America/Cambridge Bay"
  },
  {
    "id": 83,
    "name": "America/Campo Grande"
  },
  {
    "id": 84,
    "name": "America/Cancun"
  },
  {
    "id": 85,
    "name": "America/Caracas"
  },
  {
    "id": 86,
    "name": "America/Cayenne"
  },
  {
    "id": 87,
    "name": "America/Cayman"
  },
  {
    "id": 88,
    "name": "America/Chicago"
  },
  {
    "id": 89,
    "name": "America/Chihuahua"
  },
  {
    "id": 90,
    "name": "America/Ciudad Juarez"
  },
  {
    "id": 91,
    "name": "America/Costa Rica"
  },
  {
    "id": 92,
    "name": "America/Coyhaique"
  },
  {
    "id": 93,
    "name": "America/Creston"
  },
  {
    "id": 94,
    "name": "America/Cuiaba"
  },
  {
    "id": 95,
    "name": "America/Curacao"
  },
  {
    "id": 96,
    "name": "America/Danmarkshavn"
  },
  {
    "id": 97,
    "name": "America/Dawson"
  },
  {
    "id": 98,
    "name": "America/Dawson Creek"
  },
  {
    "id": 99,
    "name": "America/Denver"
  },
  {
    "id": 100,
    "name": "America/Detroit"
  },
  {
    "id": 101,
    "name": "America/Dominica"
  },
  {
    "id": 102,
    "name": "America/Edmonton"
  },
  {
    "id": 103,
    "name": "America/Eirunepe"
  },
  {
    "id": 104,
    "name": "America/El Salvador"
  },
  {
    "id": 105,
    "name": "America/Fort Nelson"
  },
  {
    "id": 106,
    "name": "America/Fortaleza"
  },
  {
    "id": 107,
    "name": "America/Glace Bay"
  },
  {
    "id": 108,
    "name": "America/Goose Bay"
  },
  {
    "id": 109,
    "name": "America/Grand Turk"
  },
  {
    "id": 110,
    "name": "America/Grenada"
  },
  {
    "id": 111,
    "name": "America/Guadeloupe"
  },
  {
    "id": 112,
    "name": "America/Guatemala"
  },
  {
    "id": 113,
    "name": "America/Guayaquil"
  },
  {
    "id": 114,
    "name": "America/Guyana"
  },
  {
    "id": 115,
    "name": "America/Halifax"
  },
  {
    "id": 116,
    "name": "America/Havana"
  },
  {
    "id": 117,
    "name": "America/Hermosillo"
  },
  {
    "id": 118,
    "name": "America/Indiana/Indianapolis"
  },
  {
    "id": 119,
    "name": "America/Indiana/Knox"
  },
  {
    "id": 120,
    "name": "America/Indiana/Marengo"
  },
  {
    "id": 121,
    "name": "America/Indiana/Petersburg"
  },
  {
    "id": 122,
    "name": "America/Indiana/Tell City"
  },
  {
    "id": 123,
    "name": "America/Indiana/Vevay"
  },
  {
    "id": 124,
    "name": "America/Indiana/Vincennes"
  },
  {
    "id": 125,
    "name": "America/Indiana/Winamac"
  },
  {
    "id": 126,
    "name": "America/Inuvik"
  },
  {
    "id": 127,
    "name": "America/Iqaluit"
  },
  {
    "id": 128,
    "name": "America/Jamaica"
  },
  {
    "id": 129,
    "name": "America/Juneau"
  },
  {
    "id": 130,
    "name": "America/Kentucky/Louisville"
  },
  {
    "id": 131,
    "name": "America/Kentucky/Monticello"
  },
  {
    "id": 132,
    "name": "America/Kralendijk"
  },
  {
    "id": 133,
    "name": "America/La Paz"
  },
  {
    "id": 134,
    "name": "America/Lima"
  },
  {
    "id": 135,
    "name": "America/Los Angeles"
  },
  {
    "id": 136,
    "name": "America/Lower Princes"
  },
  {
    "id": 137,
    "name": "America/Maceio"
  },
  {
    "id": 138,
    "name": "America/Managua"
  },
  {
    "id": 139,
    "name": "America/Manaus"
  },
  {
    "id": 140,
    "name": "America/Marigot"
  },
  {
    "id": 141,
    "name": "America/Martinique"
  },
  {
    "id": 142,
    "name": "America/Matamoros"
  },
  {
    "id": 143,
    "name": "America/Mazatlan"
  },
  {
    "id": 144,
    "name": "America/Menominee"
  },
  {
    "id": 145,
    "name": "America/Merida"
  },
  {
    "id": 146,
    "name": "America/Metlakatla"
  },
  {
    "id": 147,
    "name": "America/Mexico City"
  },
  {
    "id": 148,
    "name": "America/Miquelon"
  },
  {
    "id": 149,
    "name": "America/Moncton"
  },
  {
    "id": 150,
    "name": "America/Monterrey"
  },
  {
    "id": 151,
    "name": "America/Montevideo"
  },
  {
    "id": 152,
    "name": "America/Montserrat"
  },
  {
    "id": 153,
    "name": "America/Nassau"
  },
  {
    "id": 154,
    "name": "America/New York"
  },
  {
    "id": 155,
    "name": "America/Nome"
  },
  {
    "id": 156,
    "name": "America/Noronha"
  },
  {
    "id": 157,
    "name": "America/North Dakota/Beulah"
  },
  {
    "id": 158,
    "name": "America/North Dakota/Center"
  },
  {
    "id": 159,
    "name": "America/North Dakota/New Salem"
  },
  {
    "id": 160,
    "name": "America/Nuuk"
  },
  {
    "id": 161,
    "name": "America/Ojinaga"
  },
  {
    "id": 162,
    "name": "America/Panama"
  },
  {
    "id": 163,
    "name": "America/Paramaribo"
  },
  {
    "id": 164,
    "name": "America/Phoenix"
  },
  {
    "id": 165,
    "name": "America/Port-au-Prince"
  },
  {
    "id": 166,
    "name": "America/Port of Spain"
  },
  {
    "id": 167,
    "name": "America/Porto Velho"
  },
  {
    "id": 168,
    "name": "America/Puerto Rico"
  },
  {
    "id": 169,
    "name": "America/Punta Arenas"
  },
  {
    "id": 170,
    "name": "America/Rankin Inlet"
  },
  {
    "id": 171,
    "name": "America/Recife"
  },
  {
    "id": 172,
    "name": "America/Regina"
  },
  {
    "id": 173,
    "name": "America/Resolute"
  },
  {
    "id": 174,
    "name": "America/Rio Branco"
  },
  {
    "id": 175,
    "name": "America/Santarem"
  },
  {
    "id": 176,
    "name": "America/Santiago"
  },
  {
    "id": 177,
    "name": "America/Santo Domingo"
  },
  {
    "id": 178,
    "name": "America/Sao Paulo"
  },
  {
    "id": 179,
    "name": "America/Scoresbysund"
  },
  {
    "id": 180,
    "name": "America/Sitka"
  },
  {
    "id": 181,
    "name": "America/St Barthelemy"
  },
  {
    "id": 182,
    "name": "America/St Johns"
  },
  {
    "id": 183,
    "name": "America/St Kitts"
  },
  {
    "id": 184,
    "name": "America/St Lucia"
  },
  {
    "id": 185,
    "name": "America/St Thomas"
  },
  {
    "id": 186,
    "name": "America/St Vincent"
  },
  {
    "id": 187,
    "name": "America/Swift Current"
  },
  {
    "id": 188,
    "name": "America/Tegucigalpa"
  },
  {
    "id": 189,
    "name": "America/Thule"
  },
  {
    "id": 190,
    "name": "America/Tijuana"
  },
  {
    "id": 191,
    "name": "America/Toronto"
  },
  {
    "id": 192,
    "name": "America/Tortola"
  },
  {
    "id": 193,
    "name": "America/Vancouver"
  },
  {
    "id": 194,
    "name": "America/Whitehorse"
  },
  {
    "id": 195,
    "name": "America/Winnipeg"
  },
  {
    "id": 196,
    "name": "America/Yakutat"
  },
  {
    "id": 197,
    "name": "Antarctica/Casey"
  },
  {
    "id": 198,
    "name": "Antarctica/Davis"
  },
  {
    "id": 199,
    "name": "Antarctica/DumontDUrville"
  },
  {
    "id": 200,
    "name": "Antarctica/Macquarie"
  },
  {
    "id": 201,
    "name": "Antarctica/Mawson"
  },
  {
    "id": 202,
    "name": "Antarctica/McMurdo"
  },
  {
    "id": 203,
    "name": "Antarctica/Palmer"
  },
  {
    "id": 204,
    "name": "Antarctica/Rothera"
  },
  {
    "id": 205,
    "name": "Antarctica/Syowa"
  },
  {
    "id": 206,
    "name": "Antarctica/Troll"
  },
  {
    "id": 207,
    "name": "Antarctica/Vostok"
  },
  {
    "id": 208,
    "name": "Arctic/Longyearbyen"
  },
  {
    "id": 209,
    "name": "Asia/Aden"
  },
  {
    "id": 210,
    "name": "Asia/Almaty"
  },
  {
    "id": 211,
    "name": "Asia/Amman"
  },
  {
    "id": 212,
    "name": "Asia/Anadyr"
  },
  {
    "id": 213,
    "name": "Asia/Aqtau"
  },
  {
    "id": 214,
    "name": "Asia/Aqtobe"
  },
  {
    "id": 215,
    "name": "Asia/Ashgabat"
  },
  {
    "id": 216,
    "name": "Asia/Atyrau"
  },
  {
    "id": 217,
    "name": "Asia/Baghdad"
  },
  {
    "id": 218,
    "name": "Asia/Bahrain"
  },
  {
    "id": 219,
    "name": "Asia/Baku"
  },
  {
    "id": 220,
    "name": "Asia/Bangkok"
  },
  {
    "id": 221,
    "name": "Asia/Barnaul"
  },
  {
    "id": 222,
    "name": "Asia/Beirut"
  },
  {
    "id": 223,
    "name": "Asia/Bishkek"
  },
  {
    "id": 224,
    "name": "Asia/Brunei"
  },
  {
    "id": 225,
    "name": "Asia/Chita"
  },
  {
    "id": 226,
    "name": "Asia/Colombo"
  },
  {
    "id": 227,
    "name": "Asia/Damascus"
  },
  {
    "id": 228,
    "name": "Asia/Dhaka"
  },
  {
    "id": 229,
    "name": "Asia/Dili"
  },
  {
    "id": 230,
    "name": "Asia/Dubai"
  },
  {
    "id": 231,
    "name": "Asia/Dushanbe"
  },
  {
    "id": 232,
    "name": "Asia/Famagusta"
  },
  {
    "id": 233,
    "name": "Asia/Gaza"
  },
  {
    "id": 234,
    "name": "Asia/Hebron"
  },
  {
    "id": 235,
    "name": "Asia/Ho Chi Minh"
  },
  {
    "id": 236,
    "name": "Asia/Hong Kong"
  },
  {
    "id": 237,
    "name": "Asia/Hovd"
  },
  {
    "id": 238,
    "name": "Asia/Irkutsk"
  },
  {
    "id": 239,
    "name": "Asia/Jakarta"
  },
  {
    "id": 240,
    "name": "Asia/Jayapura"
  },
  {
    "id": 241,
    "name": "Asia/Jerusalem"
  },
  {
    "id": 242,
    "name": "Asia/Kabul"
  },
  {
    "id": 243,
    "name": "Asia/Kamchatka"
  },
  {
    "id": 244,
    "name": "Asia/Karachi"
  },
  {
    "id": 245,
    "name": "Asia/Kathmandu"
  },
  {
    "id": 246,
    "name": "Asia/Khandyga"
  },
  {
    "id": 247,
    "name": "Asia/Kolkata"
  },
  {
    "id": 248,
    "name": "Asia/Krasnoyarsk"
  },
  {
    "id": 249,
    "name": "Asia/Kuala Lumpur"
  },
  {
    "id": 250,
    "name": "Asia/Kuching"
  },
  {
    "id": 251,
    "name": "Asia/Kuwait"
  },
  {
    "id": 252,
    "name": "Asia/Macau"
  },
  {
    "id": 253,
    "name": "Asia/Magadan"
  },
  {
    "id": 254,
    "name": "Asia/Makassar"
  },
  {
    "id": 255,
    "name": "Asia/Manila"
  },
  {
    "id": 256,
    "name": "Asia/Muscat"
  },
  {
    "id": 257,
    "name": "Asia/Nicosia"
  },
  {
    "id": 258,
    "name": "Asia/Novokuznetsk"
  },
  {
    "id": 259,
    "name": "Asia/Novosibirsk"
  },
  {
    "id": 260,
    "name": "Asia/Omsk"
  },
  {
    "id": 261,
    "name": "Asia/Oral"
  },
  {
    "id": 262,
    "name": "Asia/Phnom Penh"
  },
  {
    "id": 263,
    "name": "Asia/Pontianak"
  },
  {
    "id": 264,
    "name": "Asia/Pyongyang"
  },
  {
    "id": 265,
    "name": "Asia/Qatar"
  },
  {
    "id": 266,
    "name": "Asia/Qostanay"
  },
  {
    "id": 267,
    "name": "Asia/Qyzylorda"
  },
  {
    "id": 268,
    "name": "Asia/Riyadh"
  },
  {
    "id": 269,
    "name": "Asia/Sakhalin"
  },
  {
    "id": 270,
    "name": "Asia/Samarkand"
  },
  {
    "id": 271,
    "name": "Asia/Seoul"
  },
  {
    "id": 272,
    "name": "Asia/Shanghai"
  },
  {
    "id": 273,
    "name": "Asia/Singapore"
  },
  {
    "id": 274,
    "name": "Asia/Srednekolymsk"
  },
  {
    "id": 275,
    "name": "Asia/Taipei"
  },
  {
    "id": 276,
    "name": "Asia/Tashkent"
  },
  {
    "id": 277,
    "name": "Asia/Tbilisi"
  },
  {
    "id": 278,
    "name": "Asia/Tehran"
  },
  {
    "id": 279,
    "name": "Asia/Thimphu"
  },
  {
    "id": 280,
    "name": "Asia/Tokyo"
  },
  {
    "id": 281,
    "name": "Asia/Tomsk"
  },
  {
    "id": 282,
    "name": "Asia/Ulaanbaatar"
  },
  {
    "id": 283,
    "name": "Asia/Urumqi"
  },
  {
    "id": 284,
    "name": "Asia/Ust-Nera"
  },
  {
    "id": 285,
    "name": "Asia/Vientiane"
  },
  {
    "id": 286,
    "name": "Asia/Vladivostok"
  },
  {
    "id": 287,
    "name": "Asia/Yakutsk"
  },
  {
    "id": 288,
    "name": "Asia/Yangon"
  },
  {
    "id": 289,
    "name": "Asia/Yekaterinburg"
  },
  {
    "id": 290,
    "name": "Asia/Yerevan"
  },
  {
    "id": 291,
    "name": "Atlantic/Azores"
  },
  {
    "id": 292,
    "name": "Atlantic/Bermuda"
  },
  {
    "id": 293,
    "name": "Atlantic/Canary"
  },
  {
    "id": 294,
    "name": "Atlantic/Cape Verde"
  },
  {
    "id": 295,
    "name": "Atlantic/Faroe"
  },
  {
    "id": 296,
    "name": "Atlantic/Madeira"
  },
  {
    "id": 297,
    "name": "Atlantic/Reykjavik"
  },
  {
    "id": 298,
    "name": "Atlantic/South Georgia"
  },
  {
    "id": 299,
    "name": "Atlantic/St Helena"
  },
  {
    "id": 300,
    "name": "Atlantic/Stanley"
  },
  {
    "id": 301,
    "name": "Australia/Adelaide"
  },
  {
    "id": 302,
    "name": "Australia/Brisbane"
  },
  {
    "id": 303,
    "name": "Australia/Broken Hill"
  },
  {
    "id": 304,
    "name": "Australia/Darwin"
  },
  {
    "id": 305,
    "name": "Australia/Eucla"
  },
  {
    "id": 306,
    "name": "Australia/Hobart"
  },
  {
    "id": 307,
    "name": "Australia/Lindeman"
  },
  {
    "id": 308,
    "name": "Australia/Lord Howe"
  },
  {
    "id": 309,
    "name": "Australia/Melbourne"
  },
  {
    "id": 310,
    "name": "Australia/Perth"
  },
  {
    "id": 311,
    "name": "Australia/Sydney"
  },
  {
    "id": 312,
    "name": "Europe/Amsterdam"
  },
  {
    "id": 313,
    "name": "Europe/Andorra"
  },
  {
    "id": 314,
    "name": "Europe/Astrakhan"
  },
  {
    "id": 315,
    "name": "Europe/Athens"
  },
  {
    "id": 316,
    "name": "Europe/Belgrade"
  },
  {
    "id": 317,
    "name": "Europe/Berlin"
  },
  {
    "id": 318,
    "name": "Europe/Bratislava"
  },
  {
    "id": 319,
    "name": "Europe/Brussels"
  },
  {
    "id": 320,
    "name": "Europe/Bucharest"
  },
  {
    "id": 321,
    "name": "Europe/Budapest"
  },
  {
    "id": 322,
    "name": "Europe/Busingen"
  },
  {
    "id": 323,
    "name": "Europe/Chisinau"
  },
  {
    "id": 324,
    "name": "Europe/Copenhagen"
  },
  {
    "id": 325,
    "name": "Europe/Dublin"
  },
  {
    "id": 326,
    "name": "Europe/Gibraltar"
  },
  {
    "id": 327,
    "name": "Europe/Guernsey"
  },
  {
    "id": 328,
    "name": "Europe/Helsinki"
  },
  {
    "id": 329,
    "name": "Europe/Isle of Man"
  },
  {
    "id": 330,
    "name": "Europe/Istanbul"
  },
  {
    "id": 331,
    "name": "Europe/Jersey"
  },
  {
    "id": 332,
    "name": "Europe/Kaliningrad"
  },
  {
    "id": 333,
    "name": "Europe/Kirov"
  },
  {
    "id": 334,
    "name": "Europe/Kyiv"
  },
  {
    "id": 335,
    "name": "Europe/Lisbon"
  },
  {
    "id": 336,
    "name": "Europe/Ljubljana"
  },
  {
    "id": 337,
    "name": "Europe/London"
  },
  {
    "id": 338,
    "name": "Europe/Luxembourg"
  },
  {
    "id": 339,
    "name": "Europe/Madrid"
  },
  {
    "id": 340,
    "name": "Europe/Malta"
  },
  {
    "id": 341,
    "name": "Europe/Mariehamn"
  },
  {
    "id": 342,
    "name": "Europe/Minsk"
  },
  {
    "id": 343,
    "name": "Europe/Monaco"
  },
  {
    "id": 344,
    "name": "Europe/Moscow"
  },
  {
    "id": 345,
    "name": "Europe/Oslo"
  },
  {
    "id": 346,
    "name": "Europe/Paris"
  },
  {
    "id": 347,
    "name": "Europe/Podgorica"
  },
  {
    "id": 348,
    "name": "Europe/Prague"
  },
  {
    "id": 349,
    "name": "Europe/Riga"
  },
  {
    "id": 350,
    "name": "Europe/Rome"
  },
  {
    "id": 351,
    "name": "Europe/Samara"
  },
  {
    "id": 352,
    "name": "Europe/San Marino"
  },
  {
    "id": 353,
    "name": "Europe/Sarajevo"
  },
  {
    "id": 354,
    "name": "Europe/Saratov"
  },
  {
    "id": 355,
    "name": "Europe/Simferopol"
  },
  {
    "id": 356,
    "name": "Europe/Skopje"
  },
  {
    "id": 357,
    "name": "Europe/Sofia"
  },
  {
    "id": 358,
    "name": "Europe/Stockholm"
  },
  {
    "id": 359,
    "name": "Europe/Tallinn"
  },
  {
    "id": 360,
    "name": "Europe/Tirane"
  },
  {
    "id": 361,
    "name": "Europe/Ulyanovsk"
  },
  {
    "id": 362,
    "name": "Europe/Vaduz"
  },
  {
    "id": 363,
    "name": "Europe/Vatican"
  },
  {
    "id": 364,
    "name": "Europe/Vienna"
  },
  {
    "id": 365,
    "name": "Europe/Vilnius"
  },
  {
    "id": 366,
    "name": "Europe/Volgograd"
  },
  {
    "id": 367,
    "name": "Europe/Warsaw"
  },
  {
    "id": 368,
    "name": "Europe/Zagreb"
  },
  {
    "id": 369,
    "name": "Europe/Zurich"
  },
  {
    "id": 370,
    "name": "Indian/Antananarivo"
  },
  {
    "id": 371,
    "name": "Indian/Chagos"
  },
  {
    "id": 372,
    "name": "Indian/Christmas"
  },
  {
    "id": 373,
    "name": "Indian/Cocos"
  },
  {
    "id": 374,
    "name": "Indian/Comoro"
  },
  {
    "id": 375,
    "name": "Indian/Kerguelen"
  },
  {
    "id": 376,
    "name": "Indian/Mahe"
  },
  {
    "id": 377,
    "name": "Indian/Maldives"
  },
  {
    "id": 378,
    "name": "Indian/Mauritius"
  },
  {
    "id": 379,
    "name": "Indian/Mayotte"
  },
  {
    "id": 380,
    "name": "Indian/Reunion"
  },
  {
    "id": 381,
    "name": "Pacific/Apia"
  },
  {
    "id": 382,
    "name": "Pacific/Auckland"
  },
  {
    "id": 383,
    "name": "Pacific/Bougainville"
  },
  {
    "id": 384,
    "name": "Pacific/Chatham"
  },
  {
    "id": 385,
    "name": "Pacific/Chuuk"
  },
  {
    "id": 386,
    "name": "Pacific/Easter"
  },
  {
    "id": 387,
    "name": "Pacific/Efate"
  },
  {
    "id": 388,
    "name": "Pacific/Fakaofo"
  },
  {
    "id": 389,
    "name": "Pacific/Fiji"
  },
  {
    "id": 390,
    "name": "Pacific/Funafuti"
  },
  {
    "id": 391,
    "name": "Pacific/Galapagos"
  },
  {
    "id": 392,
    "name": "Pacific/Gambier"
  },
  {
    "id": 393,
    "name": "Pacific/Guadalcanal"
  },
  {
    "id": 394,
    "name": "Pacific/Guam"
  },
  {
    "id": 395,
    "name": "Pacific/Honolulu"
  },
  {
    "id": 396,
    "name": "Pacific/Kanton"
  },
  {
    "id": 397,
    "name": "Pacific/Kiritimati"
  },
  {
    "id": 398,
    "name": "Pacific/Kosrae"
  },
  {
    "id": 399,
    "name": "Pacific/Kwajalein"
  },
  {
    "id": 400,
    "name": "Pacific/Majuro"
  },
  {
    "id": 401,
    "name": "Pacific/Marquesas"
  },
  {
    "id": 402,
    "name": "Pacific/Midway"
  },
  {
    "id": 403,
    "name": "Pacific/Nauru"
  },
  {
    "id": 404,
    "name": "Pacific/Niue"
  },
  {
    "id": 405,
    "name": "Pacific/Norfolk"
  },
  {
    "id": 406,
    "name": "Pacific/Noumea"
  },
  {
    "id": 407,
    "name": "Pacific/Pago Pago"
  },
  {
    "id": 408,
    "name": "Pacific/Palau"
  },
  {
    "id": 409,
    "name": "Pacific/Pitcairn"
  },
  {
    "id": 410,
    "name": "Pacific/Pohnpei"
  },
  {
    "id": 411,
    "name": "Pacific/Port Moresby"
  },
  {
    "id": 412,
    "name": "Pacific/Rarotonga"
  },
  {
    "id": 413,
    "name": "Pacific/Saipan"
  },
  {
    "id": 414,
    "name": "Pacific/Tahiti"
  },
  {
    "id": 415,
    "name": "Pacific/Tarawa"
  },
  {
    "id": 416,
    "name": "Pacific/Tongatapu"
  },
  {
    "id": 417,
    "name": "Pacific/Wake"
  },
  {
    "id": 418,
    "name": "Pacific/Wallis"
  },
  {
    "id": 419,
    "name": "UTC"
  }
];

export const currencyList = [
  {
    "id": 1,
    "symbol": "د.إ",
    "text": "AED (د.إ)",
    "iso": "aed"
  },
  {
    "id": 2,
    "symbol": "؋",
    "text": "AFN* (؋)",
    "iso": "afn"
  },
  {
    "id": 3,
    "symbol": "L",
    "text": "ALL (L)",
    "iso": "all"
  },
  {
    "id": 4,
    "symbol": "֏",
    "text": "AMD (֏)",
    "iso": "amd"
  },
  {
    "id": 5,
    "symbol": "ƒ",
    "text": "ANG (ƒ)",
    "iso": "ang"
  },
  {
    "id": 6,
    "symbol": "Kz",
    "text": "AOA* (Kz)",
    "iso": "aoa"
  },
  {
    "id": 7,
    "symbol": "$",
    "text": "ARS* ($)",
    "iso": "ars"
  },
  {
    "id": 8,
    "symbol": "$",
    "text": "AUD ($)",
    "iso": "aud"
  },
  {
    "id": 9,
    "symbol": "ƒ",
    "text": "AWG (ƒ)",
    "iso": "awg"
  },
  {
    "id": 10,
    "symbol": "₼",
    "text": "AZN (₼)",
    "iso": "azn"
  },
  {
    "id": 11,
    "symbol": "KM",
    "text": "BAM (KM)",
    "iso": "bam"
  },
  {
    "id": 12,
    "symbol": "$",
    "text": "BBD ($) - $",
    "iso": "bbd"
  },
  {
    "id": 13,
    "symbol": "৳",
    "text": "BDT (৳)",
    "iso": "bdt"
  },
  {
    "id": 14,
    "symbol": "лв",
    "text": "BGN (лв)",
    "iso": "bgn"
  },
  {
    "id": 15,
    "symbol": "FBu",
    "text": "BIF (FBu)",
    "iso": "bif"
  },
  {
    "id": 16,
    "symbol": "$",
    "text": "BMD ($)",
    "iso": "bmd"
  },
  {
    "id": 17,
    "symbol": "$",
    "text": "BND ($)",
    "iso": "bnd"
  },
  {
    "id": 18,
    "symbol": "Bs.",
    "text": "BOB* (Bs.)",
    "iso": "bob"
  },
  {
    "id": 19,
    "symbol": "R$",
    "text": "BRL* (R$)",
    "iso": "brl"
  },
  {
    "id": 20,
    "symbol": "$",
    "text": "BSD ($)",
    "iso": "bsd"
  },
  {
    "id": 21,
    "symbol": "P",
    "text": "BWP (P)",
    "iso": "bwp"
  },
  {
    "id": 22,
    "symbol": "Br",
    "text": "BYN (Br)",
    "iso": "byn"
  },
  {
    "id": 23,
    "symbol": "BZ$",
    "text": "BZD (BZ$) - BZ$",
    "iso": "bzd"
  },
  {
    "id": 24,
    "symbol": "$",
    "text": "CAD ($)",
    "iso": "cad"
  },
  {
    "id": 25,
    "symbol": "FC",
    "text": "CDF (FC)",
    "iso": "cdf"
  },
  {
    "id": 26,
    "symbol": "CHF",
    "text": "CHF (CHF)",
    "iso": "chf"
  },
  {
    "id": 27,
    "symbol": "$",
    "text": "CLP* ($)",
    "iso": "clp"
  },
  {
    "id": 28,
    "symbol": "¥",
    "text": "CNY (¥)",
    "iso": "cny"
  },
  {
    "id": 29,
    "symbol": "$",
    "text": "COP* ($)",
    "iso": "cop"
  },
  {
    "id": 30,
    "symbol": "₡",
    "text": "CRC* (₡)",
    "iso": "crc"
  },
  {
    "id": 31,
    "symbol": "$",
    "text": "CVE* ($)",
    "iso": "cve"
  },
  {
    "id": 32,
    "symbol": "Kč",
    "text": "CZK (Kč)",
    "iso": "czk"
  },
  {
    "id": 33,
    "symbol": "Fdj",
    "text": "DJF* (Fdj)",
    "iso": "djf"
  },
  {
    "id": 34,
    "symbol": "kr",
    "text": "DKK (kr)",
    "iso": "dkk"
  },
  {
    "id": 35,
    "symbol": "RD$",
    "text": "DOP (RD$)",
    "iso": "dop"
  },
  {
    "id": 36,
    "symbol": "د.ج",
    "text": "DZD (د.ج)",
    "iso": "dzd"
  },
  {
    "id": 37,
    "symbol": "ج.م",
    "text": "EGP (ج.م)",
    "iso": "egp"
  },
  {
    "id": 38,
    "symbol": "ብር",
    "text": "ETB (ብር)",
    "iso": "etb"
  },
  {
    "id": 39,
    "symbol": "€",
    "text": "EUR (€)",
    "iso": "eur"
  },
  {
    "id": 40,
    "symbol": "$",
    "text": "FJD ($)",
    "iso": "fjd"
  },
  {
    "id": 41,
    "symbol": "£",
    "text": "FKP (£)",
    "iso": "fkp"
  },
  {
    "id": 42,
    "symbol": "£",
    "text": "GBP (£)",
    "iso": "gbp"
  },
  {
    "id": 43,
    "symbol": "₾",
    "text": "GEL (₾)",
    "iso": "gel"
  },
  {
    "id": 44,
    "symbol": "£",
    "text": "GIP (£)",
    "iso": "gip"
  },
  {
    "id": 45,
    "symbol": "D",
    "text": "GMD (D)",
    "iso": "gmd"
  },
  {
    "id": 46,
    "symbol": "FG",
    "text": "GNF (FG)",
    "iso": "gnf"
  },
  {
    "id": 47,
    "symbol": "Q",
    "text": "GTQ (Q)",
    "iso": "gtq"
  },
  {
    "id": 48,
    "symbol": "$",
    "text": "GYD ($)",
    "iso": "gyd"
  },
  {
    "id": 49,
    "symbol": "HK$",
    "text": "HKD (HK$)",
    "iso": "hkd"
  },
  {
    "id": 50,
    "symbol": "L",
    "text": "HNL (L)",
    "iso": "hnl"
  },
  {
    "id": 51,
    "symbol": "G",
    "text": "HTG (G)",
    "iso": "htg"
  },
  {
    "id": 52,
    "symbol": "Ft",
    "text": "HUF (Ft)",
    "iso": "huf"
  },
  {
    "id": 53,
    "symbol": "Rp",
    "text": "IDR (Rp)",
    "iso": "idr"
  },
  {
    "id": 54,
    "symbol": "₪",
    "text": "ILS (₪)",
    "iso": "ils"
  },
  {
    "id": 55,
    "symbol": "₹",
    "text": "INR (₹)",
    "iso": "inr"
  },
  {
    "id": 56,
    "symbol": "kr",
    "text": "ISK (kr)",
    "iso": "isk"
  },
  {
    "id": 57,
    "symbol": "J$",
    "text": "JMD (J$)",
    "iso": "jmd"
  },
  {
    "id": 58,
    "symbol": "¥",
    "text": "JPY (¥)",
    "iso": "jpy"
  },
  {
    "id": 59,
    "symbol": "KSh",
    "text": "KES (KSh)",
    "iso": "kes"
  },
  {
    "id": 60,
    "symbol": "сом",
    "text": "KGS (сом)",
    "iso": "kgs"
  },
  {
    "id": 61,
    "symbol": "៛",
    "text": "KHR (៛)",
    "iso": "khr"
  },
  {
    "id": 62,
    "symbol": "CF",
    "text": "KMF (CF)",
    "iso": "kmf"
  },
  {
    "id": 63,
    "symbol": "₩",
    "text": "KRW (₩)",
    "iso": "krw"
  },
  {
    "id": 64,
    "symbol": "$",
    "text": "KYD ($)",
    "iso": "kyd"
  },
  {
    "id": 65,
    "symbol": "₸",
    "text": "KZT (₸)",
    "iso": "kzt"
  },
  {
    "id": 66,
    "symbol": "₭",
    "text": "LAK (₭)",
    "iso": "lak"
  },
  {
    "id": 67,
    "symbol": "ل.ل",
    "text": "LBP (ل.ل)",
    "iso": "lbp"
  },
  {
    "id": 68,
    "symbol": "₨",
    "text": "LKR (₨)",
    "iso": "lkr"
  },
  {
    "id": 69,
    "symbol": "$",
    "text": "LRD ($)",
    "iso": "lrd"
  },
  {
    "id": 70,
    "symbol": "L",
    "text": "LSL (L)",
    "iso": "lsl"
  },
  {
    "id": 71,
    "symbol": "د.م.",
    "text": "MAD (د.م.)",
    "iso": "mad"
  },
  {
    "id": 72,
    "symbol": "lei",
    "text": "MDL (lei)",
    "iso": "mdl"
  },
  {
    "id": 73,
    "symbol": "Ar",
    "text": "MGA (Ar)",
    "iso": "mga"
  },
  {
    "id": 74,
    "symbol": "ден",
    "text": "MKD (ден)",
    "iso": "mkd"
  },
  {
    "id": 75,
    "symbol": "K",
    "text": "MMK (K)",
    "iso": "mmk"
  },
  {
    "id": 76,
    "symbol": "₮",
    "text": "MNT (₮)",
    "iso": "mnt"
  },
  {
    "id": 77,
    "symbol": "MOP$",
    "text": "MOP (MOP$)",
    "iso": "mop"
  },
  {
    "id": 78,
    "symbol": "₨",
    "text": "MUR (₨)",
    "iso": "mur"
  },
  {
    "id": 79,
    "symbol": "Rf",
    "text": "MVR (Rf)",
    "iso": "mvr"
  },
  {
    "id": 80,
    "symbol": "MK",
    "text": "MWK (MK)",
    "iso": "mwk"
  },
  {
    "id": 81,
    "symbol": "$",
    "text": "MXN ($)",
    "iso": "mxn"
  },
  {
    "id": 82,
    "symbol": "RM",
    "text": "MYR (RM)",
    "iso": "myr"
  },
  {
    "id": 83,
    "symbol": "MT",
    "text": "MZN (MT)",
    "iso": "mzn"
  },
  {
    "id": 84,
    "symbol": "$",
    "text": "NAD ($)",
    "iso": "nad"
  },
  {
    "id": 85,
    "symbol": "₦",
    "text": "NGN (₦)",
    "iso": "ngn"
  },
  {
    "id": 86,
    "symbol": "C$",
    "text": "NIO (C$)",
    "iso": "nio"
  },
  {
    "id": 87,
    "symbol": "kr",
    "text": "NOK (kr)",
    "iso": "nok"
  },
  {
    "id": 88,
    "symbol": "₨",
    "text": "NPR (₨)",
    "iso": "npr"
  },
  {
    "id": 89,
    "symbol": "$",
    "text": "NZD ($)",
    "iso": "nzd"
  },
  {
    "id": 90,
    "symbol": "B/.",
    "text": "PAB (B/.)",
    "iso": "pab"
  },
  {
    "id": 91,
    "symbol": "S/",
    "text": "PEN (S/)",
    "iso": "pen"
  },
  {
    "id": 92,
    "symbol": "K",
    "text": "PGK (K)",
    "iso": "pgk"
  },
  {
    "id": 93,
    "symbol": "₱",
    "text": "PHP (₱)",
    "iso": "php"
  },
  {
    "id": 94,
    "symbol": "₨",
    "text": "PKR (₨)",
    "iso": "pkr"
  },
  {
    "id": 95,
    "symbol": "zł",
    "text": "PLN (zł)",
    "iso": "pln"
  },
  {
    "id": 96,
    "symbol": "₲",
    "text": "PYG (₲)",
    "iso": "pyg"
  },
  {
    "id": 97,
    "symbol": "ر.ق",
    "text": "QAR (ر.ق)",
    "iso": "qar"
  },
  {
    "id": 98,
    "symbol": "lei",
    "text": "RON (lei)",
    "iso": "ron"
  },
  {
    "id": 99,
    "symbol": "дин.",
    "text": "RSD (дин.)",
    "iso": "rsd"
  },
  {
    "id": 100,
    "symbol": "₽",
    "text": "RUB (₽)",
    "iso": "rub"
  },
  {
    "id": 101,
    "symbol": "RF",
    "text": "RWF (RF)",
    "iso": "rwf"
  },
  {
    "id": 102,
    "symbol": "ر.س",
    "text": "SAR (ر.س)",
    "iso": "sar"
  },
  {
    "id": 103,
    "symbol": "$",
    "text": "SBD ($)",
    "iso": "sbd"
  },
  {
    "id": 104,
    "symbol": "₨",
    "text": "SCR (₨)",
    "iso": "scr"
  },
  {
    "id": 105,
    "symbol": "kr",
    "text": "SEK (kr)",
    "iso": "sek"
  },
  {
    "id": 106,
    "symbol": "$",
    "text": "SGD ($)",
    "iso": "sgd"
  },
  {
    "id": 107,
    "symbol": "£",
    "text": "SHP (£)",
    "iso": "shp"
  },
  {
    "id": 108,
    "symbol": "Le",
    "text": "SLE (Le)",
    "iso": "sle"
  },
  {
    "id": 109,
    "symbol": "S",
    "text": "SOS (S)",
    "iso": "sos"
  },
  {
    "id": 110,
    "symbol": "$",
    "text": "SRD ($)",
    "iso": "srd"
  },
  {
    "id": 111,
    "symbol": "Db",
    "text": "STD (Db)",
    "iso": "std"
  },
  {
    "id": 112,
    "symbol": "E",
    "text": "SZL (E)",
    "iso": "szl"
  },
  {
    "id": 113,
    "symbol": "฿",
    "text": "THB (฿)",
    "iso": "thb"
  },
  {
    "id": 114,
    "symbol": "ЅМ",
    "text": "TJS (ЅМ)",
    "iso": "tjs"
  },
  {
    "id": 115,
    "symbol": "T$",
    "text": "TOP (T$)",
    "iso": "top"
  },
  {
    "id": 116,
    "symbol": "₺",
    "text": "TRY (₺)",
    "iso": "try"
  },
  {
    "id": 117,
    "symbol": "$",
    "text": "TTD ($)",
    "iso": "ttd"
  },
  {
    "id": 118,
    "symbol": "NT$",
    "text": "TWD (NT$)",
    "iso": "twd"
  },
  {
    "id": 119,
    "symbol": "TSh",
    "text": "TZS (TSh)",
    "iso": "tzs"
  },
  {
    "id": 120,
    "symbol": "₴",
    "text": "UAH (₴)",
    "iso": "uah"
  },
  {
    "id": 121,
    "symbol": "USh",
    "text": "UGX (USh)",
    "iso": "ugx"
  },
  {
    "id": 122,
    "symbol": "$",
    "text": "USD ($)",
    "iso": "usd"
  },
  {
    "id": 123,
    "symbol": "$U",
    "text": "UYU ($U)",
    "iso": "uyu"
  },
  {
    "id": 124,
    "symbol": "so'm",
    "text": "UZS (so'm)",
    "iso": "uzs"
  },
  {
    "id": 125,
    "symbol": "₫",
    "text": "VND (₫)",
    "iso": "vnd"
  },
  {
    "id": 126,
    "symbol": "VT",
    "text": "VUV (VT)",
    "iso": "vuv"
  },
  {
    "id": 127,
    "symbol": "WS$",
    "text": "WST (WS$)",
    "iso": "wst"
  },
  {
    "id": 128,
    "symbol": "FCFA",
    "text": "XAF (FCFA)",
    "iso": "xaf"
  },
  {
    "id": 129,
    "symbol": "$",
    "text": "XCD ($)",
    "iso": "xcd"
  },
  {
    "id": 130,
    "symbol": "CFA",
    "text": "XOF (CFA)",
    "iso": "xof"
  },
  {
    "id": 131,
    "symbol": "₣",
    "text": "XPF (₣)",
    "iso": "xpf"
  },
  {
    "id": 132,
    "symbol": "﷼",
    "text": "YER (﷼)",
    "iso": "yer"
  },
  {
    "id": 133,
    "symbol": "R",
    "text": "ZAR (R)",
    "iso": "zar"
  },
  {
    "id": 134,
    "symbol": "ZK",
    "text": "ZMW (ZK)",
    "iso": "zmw"
  }
];