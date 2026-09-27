export interface PopularCityTelemetry {
  id: string;
  name: string;
  state: string;
  region: string;
  lat: number;
  lng: number;
  defaultTempC: number;
  defaultAqi: number;
  defaultWindKmh: number;
  defaultHumidity: number;
  defaultCondition: string;
  defaultIcon: string;
}

export const POPULAR_55_CITIES: PopularCityTelemetry[] = [
  // ==========================================
  // 1. WEST & MAHARASHTRA
  // ==========================================
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', region: 'West Coast', lat: 18.9220, lng: 72.8347, defaultTempC: 30, defaultAqi: 88, defaultWindKmh: 14, defaultHumidity: 72, defaultCondition: 'Humid & Hazy', defaultIcon: '⛅' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', region: 'Western Deccan', lat: 18.5204, lng: 73.8567, defaultTempC: 28, defaultAqi: 65, defaultWindKmh: 11, defaultHumidity: 58, defaultCondition: 'Breezy & Mild', defaultIcon: '🌤️' },
  { id: 'lonavala', name: 'Lonavala', state: 'Maharashtra', region: 'Western Ghats', lat: 18.7557, lng: 73.4091, defaultTempC: 24, defaultAqi: 35, defaultWindKmh: 16, defaultHumidity: 78, defaultCondition: 'Misty & Overcast', defaultIcon: '🌫️' },
  { id: 'mahabaleshwar', name: 'Mahabaleshwar', state: 'Maharashtra', region: 'Sahyadri Hills', lat: 17.9237, lng: 73.6586, defaultTempC: 21, defaultAqi: 25, defaultWindKmh: 14, defaultHumidity: 76, defaultCondition: 'Cool Mountain Air', defaultIcon: '🌲' },
  { id: 'nashik', name: 'Nashik', state: 'Maharashtra', region: 'North Maharashtra', lat: 19.9975, lng: 73.7898, defaultTempC: 27, defaultAqi: 52, defaultWindKmh: 12, defaultHumidity: 55, defaultCondition: 'Clear & Fresh', defaultIcon: '☀️' },
  { id: 'panvel', name: 'Panvel', state: 'Maharashtra', region: 'Konkan Gateway', lat: 18.9894, lng: 73.1175, defaultTempC: 30, defaultAqi: 82, defaultWindKmh: 13, defaultHumidity: 70, defaultCondition: 'Warm Breeze', defaultIcon: '🌤️' },
  { id: 'alibaug', name: 'Alibaug', state: 'Maharashtra', region: 'North Konkan', lat: 18.6414, lng: 72.8722, defaultTempC: 29, defaultAqi: 42, defaultWindKmh: 15, defaultHumidity: 75, defaultCondition: 'Coastal Breeze', defaultIcon: '🏖️' },
  { id: 'ratnagiri', name: 'Ratnagiri', state: 'Maharashtra', region: 'South Konkan', lat: 16.9902, lng: 73.3120, defaultTempC: 29, defaultAqi: 35, defaultWindKmh: 16, defaultHumidity: 78, defaultCondition: 'Sea Breeze', defaultIcon: '🌊' },
  { id: 'aurangabad', name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', region: 'Marathwada', lat: 19.8762, lng: 75.3433, defaultTempC: 31, defaultAqi: 75, defaultWindKmh: 10, defaultHumidity: 48, defaultCondition: 'Sunny & Dry', defaultIcon: '☀️' },
  { id: 'solapur', name: 'Solapur', state: 'Maharashtra', region: 'Western Maharashtra', lat: 17.6599, lng: 75.9064, defaultTempC: 32, defaultAqi: 70, defaultWindKmh: 12, defaultHumidity: 44, defaultCondition: 'Warm & Sunny', defaultIcon: '☀️' },
  { id: 'kolhapur', name: 'Kolhapur', state: 'Maharashtra', region: 'South Maharashtra', lat: 16.7050, lng: 74.2433, defaultTempC: 29, defaultAqi: 48, defaultWindKmh: 12, defaultHumidity: 62, defaultCondition: 'Partly Cloudy', defaultIcon: '⛅' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', region: 'Vidarbha', lat: 21.1458, lng: 79.0882, defaultTempC: 33, defaultAqi: 94, defaultWindKmh: 9, defaultHumidity: 45, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'amravati', name: 'Amravati', state: 'Maharashtra', region: 'Vidarbha', lat: 20.9320, lng: 77.7523, defaultTempC: 32, defaultAqi: 85, defaultWindKmh: 10, defaultHumidity: 46, defaultCondition: 'Sunny & Warm', defaultIcon: '☀️' },
  { id: 'nanded', name: 'Nanded', state: 'Maharashtra', region: 'Godavari Basin', lat: 19.1383, lng: 77.3210, defaultTempC: 31, defaultAqi: 72, defaultWindKmh: 11, defaultHumidity: 48, defaultCondition: 'Clear Sky', defaultIcon: '☀️' },

  // ==========================================
  // 2. GUJARAT & GOA
  // ==========================================
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', region: 'Central Gujarat', lat: 23.0225, lng: 72.5714, defaultTempC: 33, defaultAqi: 125, defaultWindKmh: 12, defaultHumidity: 42, defaultCondition: 'Warm & Dry', defaultIcon: '☀️' },
  { id: 'vadodara', name: 'Vadodara', state: 'Gujarat', region: 'Central Gujarat', lat: 22.3072, lng: 73.1812, defaultTempC: 32, defaultAqi: 110, defaultWindKmh: 11, defaultHumidity: 46, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'surat', name: 'Surat', state: 'Gujarat', region: 'South Gujarat', lat: 21.1702, lng: 72.8311, defaultTempC: 31, defaultAqi: 98, defaultWindKmh: 15, defaultHumidity: 68, defaultCondition: 'Coastal Haze', defaultIcon: '🌤️' },
  { id: 'rajkot', name: 'Rajkot', state: 'Gujarat', region: 'Saurashtra', lat: 22.3039, lng: 70.8022, defaultTempC: 32, defaultAqi: 85, defaultWindKmh: 14, defaultHumidity: 45, defaultCondition: 'Sunny & Breezy', defaultIcon: '☀️' },
  { id: 'bhuj', name: 'Bhuj', state: 'Gujarat', region: 'Kutch', lat: 23.2420, lng: 69.6669, defaultTempC: 32, defaultAqi: 58, defaultWindKmh: 18, defaultHumidity: 38, defaultCondition: 'Arid & Windy', defaultIcon: '💨' },
  { id: 'dwarka', name: 'Dwarka', state: 'Gujarat', region: 'Saurashtra Coast', lat: 22.2442, lng: 68.9685, defaultTempC: 29, defaultAqi: 42, defaultWindKmh: 20, defaultHumidity: 74, defaultCondition: 'Ocean Gusts', defaultIcon: '🌊' },
  { id: 'somnath', name: 'Somnath', state: 'Gujarat', region: 'Saurashtra Coast', lat: 20.9016, lng: 70.4011, defaultTempC: 29, defaultAqi: 40, defaultWindKmh: 18, defaultHumidity: 75, defaultCondition: 'Coastal Sun', defaultIcon: '🌅' },
  { id: 'panaji', name: 'Panaji', state: 'Goa', region: 'Coastal Konkan', lat: 15.4909, lng: 73.8278, defaultTempC: 29, defaultAqi: 32, defaultWindKmh: 17, defaultHumidity: 79, defaultCondition: 'Tropical Breeze', defaultIcon: '🌴' },

  // ==========================================
  // 3. CENTRAL INDIA (MADHYA PRADESH & CHHATTISGARH)
  // ==========================================
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', region: 'Malwa Plateau', lat: 23.2599, lng: 77.4126, defaultTempC: 29, defaultAqi: 85, defaultWindKmh: 10, defaultHumidity: 50, defaultCondition: 'Clear Sky', defaultIcon: '☀️' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', region: 'Malwa', lat: 22.7196, lng: 75.8577, defaultTempC: 30, defaultAqi: 72, defaultWindKmh: 12, defaultHumidity: 46, defaultCondition: 'Pleasant & Sunny', defaultIcon: '☀️' },
  { id: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', region: 'Shipra Basin', lat: 23.1765, lng: 75.7885, defaultTempC: 30, defaultAqi: 68, defaultWindKmh: 10, defaultHumidity: 48, defaultCondition: 'Clear', defaultIcon: '☀️' },
  { id: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh', region: 'Chambal', lat: 26.2183, lng: 78.1828, defaultTempC: 31, defaultAqi: 130, defaultWindKmh: 9, defaultHumidity: 44, defaultCondition: 'Hazy Sun', defaultIcon: '🌤️' },
  { id: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', region: 'Mahakoshal', lat: 23.1815, lng: 79.9864, defaultTempC: 29, defaultAqi: 85, defaultWindKmh: 10, defaultHumidity: 52, defaultCondition: 'Pleasant & Calm', defaultIcon: '🌤️' },
  { id: 'khajuraho', name: 'Khajuraho', state: 'Madhya Pradesh', region: 'Bundelkhand', lat: 24.8318, lng: 79.9199, defaultTempC: 29, defaultAqi: 45, defaultWindKmh: 8, defaultHumidity: 49, defaultCondition: 'Clear & Calm', defaultIcon: '☀️' },
  { id: 'rewa', name: 'Rewa', state: 'Madhya Pradesh', region: 'Vindhya Region', lat: 24.5362, lng: 81.3037, defaultTempC: 30, defaultAqi: 92, defaultWindKmh: 9, defaultHumidity: 50, defaultCondition: 'Sunny & Clear', defaultIcon: '☀️' },
  { id: 'sagar', name: 'Sagar', state: 'Madhya Pradesh', region: 'Bundelkhand', lat: 23.8388, lng: 78.7378, defaultTempC: 29, defaultAqi: 80, defaultWindKmh: 10, defaultHumidity: 48, defaultCondition: 'Breezy & Sunny', defaultIcon: '🌤️' },
  { id: 'pachmarhi', name: 'Pachmarhi', state: 'Madhya Pradesh', region: 'Satpura Hills', lat: 22.4674, lng: 78.4346, defaultTempC: 22, defaultAqi: 30, defaultWindKmh: 14, defaultHumidity: 65, defaultCondition: 'Fresh Highland Breeze', defaultIcon: '🌲' },
  { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', region: 'Central Chhattisgarh', lat: 21.2514, lng: 81.6296, defaultTempC: 31, defaultAqi: 95, defaultWindKmh: 11, defaultHumidity: 55, defaultCondition: 'Warm & Clear', defaultIcon: '☀️' },
  { id: 'bhilai', name: 'Bhilai', state: 'Chhattisgarh', region: 'Durg Basin', lat: 21.1938, lng: 81.3509, defaultTempC: 31, defaultAqi: 105, defaultWindKmh: 10, defaultHumidity: 54, defaultCondition: 'Warm Sun', defaultIcon: '☀️' },
  { id: 'bilaspur', name: 'Bilaspur', state: 'Chhattisgarh', region: 'North Chhattisgarh', lat: 22.0797, lng: 82.1409, defaultTempC: 31, defaultAqi: 90, defaultWindKmh: 10, defaultHumidity: 52, defaultCondition: 'Sunny Sky', defaultIcon: '☀️' },
  { id: 'jagdalpur', name: 'Jagdalpur', state: 'Chhattisgarh', region: 'Bastar Plateau', lat: 19.0744, lng: 82.0080, defaultTempC: 28, defaultAqi: 45, defaultWindKmh: 12, defaultHumidity: 64, defaultCondition: 'Lush Forest Breeze', defaultIcon: '🍃' },

  // ==========================================
  // 4. BIHAR & JHARKHAND
  // ==========================================
  { id: 'patna', name: 'Patna', state: 'Bihar', region: 'Gangetic Plains', lat: 25.5941, lng: 85.1376, defaultTempC: 30, defaultAqi: 145, defaultWindKmh: 8, defaultHumidity: 62, defaultCondition: 'Hazy Sunlight', defaultIcon: '🌫️' },
  { id: 'gaya', name: 'Gaya / Bodh Gaya', state: 'Bihar', region: 'Magadh', lat: 24.7914, lng: 85.0002, defaultTempC: 31, defaultAqi: 120, defaultWindKmh: 9, defaultHumidity: 56, defaultCondition: 'Sunny & Warm', defaultIcon: '☀️' },
  { id: 'bhagalpur', name: 'Bhagalpur', state: 'Bihar', region: 'Anga Region', lat: 25.2425, lng: 86.9842, defaultTempC: 30, defaultAqi: 130, defaultWindKmh: 8, defaultHumidity: 65, defaultCondition: 'River Breeze', defaultIcon: '🌤️' },
  { id: 'muzaffarpur', name: 'Muzaffarpur', state: 'Bihar', region: 'Tirhut', lat: 26.1209, lng: 85.3647, defaultTempC: 29, defaultAqi: 150, defaultWindKmh: 7, defaultHumidity: 68, defaultCondition: 'Warm & Hazy', defaultIcon: '🌫️' },
  { id: 'rajgir', name: 'Rajgir', state: 'Bihar', region: 'Nalanda Belt', lat: 25.0298, lng: 85.4206, defaultTempC: 29, defaultAqi: 95, defaultWindKmh: 9, defaultHumidity: 58, defaultCondition: 'Valley Sun', defaultIcon: '🌤️' },
  { id: 'ranchi', name: 'Ranchi', state: 'Jharkhand', region: 'Chota Nagpur Plateau', lat: 23.3441, lng: 85.3096, defaultTempC: 27, defaultAqi: 85, defaultWindKmh: 11, defaultHumidity: 55, defaultCondition: 'Pleasant Plateau Air', defaultIcon: '🌤️' },
  { id: 'jamshedpur', name: 'Jamshedpur', state: 'Jharkhand', region: 'East Singhbhum', lat: 22.8046, lng: 86.2029, defaultTempC: 30, defaultAqi: 110, defaultWindKmh: 10, defaultHumidity: 54, defaultCondition: 'Sunny & Industrial', defaultIcon: '☀️' },
  { id: 'dhanbad', name: 'Dhanbad', state: 'Jharkhand', region: 'Coal Belt', lat: 23.7957, lng: 86.4304, defaultTempC: 30, defaultAqi: 140, defaultWindKmh: 9, defaultHumidity: 52, defaultCondition: 'Hazy Sky', defaultIcon: '🌫️' },
  { id: 'deoghar', name: 'Deoghar', state: 'Jharkhand', region: 'Santhal Pargana', lat: 24.4826, lng: 86.7015, defaultTempC: 28, defaultAqi: 78, defaultWindKmh: 10, defaultHumidity: 58, defaultCondition: 'Mild & Sunny', defaultIcon: '☀️' },

  // ==========================================
  // 5. ODISHA & WEST BENGAL
  // ==========================================
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', region: 'Lower Gangetic Plain', lat: 22.5726, lng: 88.3639, defaultTempC: 31, defaultAqi: 138, defaultWindKmh: 10, defaultHumidity: 75, defaultCondition: 'Warm & Humid', defaultIcon: '⛅' },
  { id: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', region: 'Eastern Himalayas', lat: 27.0410, lng: 88.2663, defaultTempC: 16, defaultAqi: 22, defaultWindKmh: 12, defaultHumidity: 75, defaultCondition: 'Misty Tea Gardens', defaultIcon: '🍵' },
  { id: 'siliguri', name: 'Siliguri', state: 'West Bengal', region: 'Terai Gateway', lat: 26.7271, lng: 88.3953, defaultTempC: 26, defaultAqi: 60, defaultWindKmh: 10, defaultHumidity: 70, defaultCondition: 'Foothill Breeze', defaultIcon: '🌤️' },
  { id: 'asansol', name: 'Asansol', state: 'West Bengal', region: 'Damodar Basin', lat: 23.6739, lng: 86.9524, defaultTempC: 30, defaultAqi: 125, defaultWindKmh: 9, defaultHumidity: 58, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'durgapur', name: 'Durgapur', state: 'West Bengal', region: 'Bardhaman Belt', lat: 23.5204, lng: 87.3119, defaultTempC: 30, defaultAqi: 118, defaultWindKmh: 10, defaultHumidity: 60, defaultCondition: 'Warm Sun', defaultIcon: '☀️' },
  { id: 'digha', name: 'Digha', state: 'West Bengal', region: 'Bay Coast', lat: 21.6266, lng: 87.5074, defaultTempC: 29, defaultAqi: 45, defaultWindKmh: 18, defaultHumidity: 80, defaultCondition: 'Sea Breeze', defaultIcon: '🏖️' },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', region: 'Coastal Odisha', lat: 20.2961, lng: 85.8245, defaultTempC: 31, defaultAqi: 76, defaultWindKmh: 12, defaultHumidity: 70, defaultCondition: 'Sunny & Warm', defaultIcon: '☀️' },
  { id: 'cuttack', name: 'Cuttack', state: 'Odisha', region: 'Mahanadi Delta', lat: 20.4625, lng: 85.8828, defaultTempC: 31, defaultAqi: 72, defaultWindKmh: 13, defaultHumidity: 68, defaultCondition: 'River Valley Sun', defaultIcon: '🌤️' },
  { id: 'puri', name: 'Puri', state: 'Odisha', region: 'Bay of Bengal Coast', lat: 19.8135, lng: 85.8312, defaultTempC: 30, defaultAqi: 45, defaultWindKmh: 19, defaultHumidity: 82, defaultCondition: 'Seaside Gusts', defaultIcon: '🌊' },
  { id: 'rourkela', name: 'Rourkela', state: 'Odisha', region: 'Sundargarh', lat: 22.2604, lng: 84.8536, defaultTempC: 30, defaultAqi: 105, defaultWindKmh: 10, defaultHumidity: 55, defaultCondition: 'Warm & Sunny', defaultIcon: '☀️' },
  { id: 'sambalpur', name: 'Sambalpur', state: 'Odisha', region: 'Western Odisha', lat: 21.4669, lng: 83.9812, defaultTempC: 31, defaultAqi: 85, defaultWindKmh: 10, defaultHumidity: 56, defaultCondition: 'Sunny Sky', defaultIcon: '☀️' },

  // ==========================================
  // 6. NORTH EAST INDIA
  // ==========================================
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', region: 'Brahmaputra Valley', lat: 26.1445, lng: 91.7362, defaultTempC: 28, defaultAqi: 68, defaultWindKmh: 8, defaultHumidity: 72, defaultCondition: 'River Valley Haze', defaultIcon: '🌤️' },
  { id: 'dibrugarh', name: 'Dibrugarh', state: 'Assam', region: 'Upper Assam', lat: 27.4728, lng: 94.9120, defaultTempC: 25, defaultAqi: 35, defaultWindKmh: 8, defaultHumidity: 76, defaultCondition: 'Tea Country Sun', defaultIcon: '🍃' },
  { id: 'jorhat', name: 'Jorhat', state: 'Assam', region: 'Central Assam', lat: 26.7509, lng: 94.2037, defaultTempC: 26, defaultAqi: 40, defaultWindKmh: 8, defaultHumidity: 74, defaultCondition: 'Pleasant & Mild', defaultIcon: '🌤️' },
  { id: 'shillong', name: 'Shillong', state: 'Meghalaya', region: 'Khasi Hills', lat: 25.5788, lng: 91.8933, defaultTempC: 19, defaultAqi: 20, defaultWindKmh: 11, defaultHumidity: 74, defaultCondition: 'Cloud Canopy', defaultIcon: '☁️' },
  { id: 'gangtok', name: 'Gangtok', state: 'Sikkim', region: 'Eastern Himalayas', lat: 27.3389, lng: 88.6065, defaultTempC: 17, defaultAqi: 19, defaultWindKmh: 10, defaultHumidity: 78, defaultCondition: 'Mountain Mist', defaultIcon: '🏔️' },
  { id: 'agartala', name: 'Agartala', state: 'Tripura', region: 'Tripura Plains', lat: 23.8315, lng: 91.2868, defaultTempC: 28, defaultAqi: 50, defaultWindKmh: 9, defaultHumidity: 72, defaultCondition: 'Mild & Breezy', defaultIcon: '🌤️' },
  { id: 'aizawl', name: 'Aizawl', state: 'Mizoram', region: 'Mizo Hills', lat: 23.7271, lng: 92.7176, defaultTempC: 21, defaultAqi: 22, defaultWindKmh: 10, defaultHumidity: 70, defaultCondition: 'Ridge Wind', defaultIcon: '🍃' },
  { id: 'imphal', name: 'Imphal', state: 'Manipur', region: 'Manipur Valley', lat: 24.8170, lng: 93.9368, defaultTempC: 23, defaultAqi: 28, defaultWindKmh: 8, defaultHumidity: 68, defaultCondition: 'Valley Mist', defaultIcon: '🌤️' },
  { id: 'kohima', name: 'Kohima', state: 'Nagaland', region: 'Naga Hills', lat: 25.6751, lng: 94.1086, defaultTempC: 19, defaultAqi: 20, defaultWindKmh: 9, defaultHumidity: 72, defaultCondition: 'Highland Breeze', defaultIcon: '🌲' },
  { id: 'itanagar', name: 'Itanagar', state: 'Arunachal Pradesh', region: 'Himalayan Foothills', lat: 27.0844, lng: 93.6053, defaultTempC: 22, defaultAqi: 24, defaultWindKmh: 8, defaultHumidity: 75, defaultCondition: 'Alpine Mist', defaultIcon: '🏔️' },

  // ==========================================
  // 7. NORTH INDIA (DELHI, UP, RAJASTHAN, PUNJAB, HARYANA)
  // ==========================================
  { id: 'delhi', name: 'Delhi', state: 'Delhi', region: 'National Capital Region', lat: 28.6139, lng: 77.2090, defaultTempC: 29, defaultAqi: 168, defaultWindKmh: 8, defaultHumidity: 56, defaultCondition: 'Hazy Sunlight', defaultIcon: '🌫️' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', region: 'Dhundhar', lat: 26.9124, lng: 75.7873, defaultTempC: 29, defaultAqi: 112, defaultWindKmh: 11, defaultHumidity: 43, defaultCondition: 'Sunny & Warm', defaultIcon: '☀️' },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', region: 'Mewar', lat: 24.5854, lng: 73.7125, defaultTempC: 28, defaultAqi: 64, defaultWindKmh: 12, defaultHumidity: 52, defaultCondition: 'Lake Breeze & Sun', defaultIcon: '🌤️' },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', region: 'Marwar', lat: 26.2389, lng: 73.0243, defaultTempC: 32, defaultAqi: 88, defaultWindKmh: 14, defaultHumidity: 35, defaultCondition: 'Sunny & Arid', defaultIcon: '☀️' },
  { id: 'jaisalmer', name: 'Jaisalmer', state: 'Rajasthan', region: 'Thar Desert', lat: 26.9157, lng: 70.9083, defaultTempC: 33, defaultAqi: 54, defaultWindKmh: 20, defaultHumidity: 28, defaultCondition: 'Desert Winds', defaultIcon: '🏜️' },
  { id: 'pushkar', name: 'Pushkar', state: 'Rajasthan', region: 'Ajmer Belt', lat: 26.4899, lng: 74.5511, defaultTempC: 29, defaultAqi: 70, defaultWindKmh: 13, defaultHumidity: 40, defaultCondition: 'Sunny & Dry', defaultIcon: '☀️' },
  { id: 'bikaner', name: 'Bikaner', state: 'Rajasthan', region: 'Thar Border', lat: 28.0229, lng: 73.3119, defaultTempC: 31, defaultAqi: 78, defaultWindKmh: 15, defaultHumidity: 32, defaultCondition: 'Sunny Winds', defaultIcon: '☀️' },
  { id: 'kota', name: 'Kota', state: 'Rajasthan', region: 'Hadoti', lat: 25.2138, lng: 75.8648, defaultTempC: 31, defaultAqi: 95, defaultWindKmh: 11, defaultHumidity: 44, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'ajmer', name: 'Ajmer', state: 'Rajasthan', region: 'Aravalli Belt', lat: 26.4499, lng: 74.6399, defaultTempC: 29, defaultAqi: 75, defaultWindKmh: 12, defaultHumidity: 42, defaultCondition: 'Clear & Bright', defaultIcon: '☀️' },
  { id: 'mount_abu', name: 'Mount Abu', state: 'Rajasthan', region: 'Aravalli Highlands', lat: 24.5926, lng: 72.7156, defaultTempC: 22, defaultAqi: 35, defaultWindKmh: 14, defaultHumidity: 55, defaultCondition: 'Cool Hill Breeze', defaultIcon: '🌲' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', region: 'Purvanchal', lat: 25.3176, lng: 82.9739, defaultTempC: 30, defaultAqi: 142, defaultWindKmh: 7, defaultHumidity: 65, defaultCondition: 'Riverine Haze', defaultIcon: '🌤️' },
  { id: 'prayagraj', name: 'Prayagraj', state: 'Uttar Pradesh', region: 'Triveni Sangam', lat: 25.4358, lng: 81.8463, defaultTempC: 30, defaultAqi: 134, defaultWindKmh: 8, defaultHumidity: 61, defaultCondition: 'Clear & Warm', defaultIcon: '☀️' },
  { id: 'ayodhya', name: 'Ayodhya', state: 'Uttar Pradesh', region: 'Awadh', lat: 26.7922, lng: 82.1998, defaultTempC: 29, defaultAqi: 122, defaultWindKmh: 7, defaultHumidity: 62, defaultCondition: 'Mild & Clear', defaultIcon: '☀️' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', region: 'Awadh', lat: 26.8467, lng: 80.9462, defaultTempC: 29, defaultAqi: 148, defaultWindKmh: 8, defaultHumidity: 60, defaultCondition: 'Sunny & Gentle', defaultIcon: '☀️' },
  { id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', region: 'Central UP', lat: 26.4499, lng: 80.3319, defaultTempC: 30, defaultAqi: 160, defaultWindKmh: 8, defaultHumidity: 58, defaultCondition: 'Hazy Sunlight', defaultIcon: '🌫️' },
  { id: 'gorakhpur', name: 'Gorakhpur', state: 'Uttar Pradesh', region: 'Purvanchal', lat: 26.7606, lng: 83.3732, defaultTempC: 29, defaultAqi: 138, defaultWindKmh: 8, defaultHumidity: 64, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', region: 'Braj', lat: 27.1767, lng: 78.0081, defaultTempC: 30, defaultAqi: 155, defaultWindKmh: 8, defaultHumidity: 54, defaultCondition: 'Hazy Sky', defaultIcon: '🌤️' },
  { id: 'mathura', name: 'Mathura', state: 'Uttar Pradesh', region: 'Braj', lat: 27.4924, lng: 77.6737, defaultTempC: 29, defaultAqi: 150, defaultWindKmh: 9, defaultHumidity: 52, defaultCondition: 'Sunny & Warm', defaultIcon: '☀️' },
  { id: 'jhansi', name: 'Jhansi', state: 'Uttar Pradesh', region: 'Bundelkhand', lat: 25.4484, lng: 78.5685, defaultTempC: 31, defaultAqi: 115, defaultWindKmh: 10, defaultHumidity: 48, defaultCondition: 'Clear Sky', defaultIcon: '☀️' },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', region: 'Majha', lat: 31.6340, lng: 74.8723, defaultTempC: 27, defaultAqi: 118, defaultWindKmh: 10, defaultHumidity: 58, defaultCondition: 'Breezy & Sunny', defaultIcon: '🌤️' },
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', region: 'Malwa', lat: 30.9010, lng: 75.8573, defaultTempC: 27, defaultAqi: 130, defaultWindKmh: 9, defaultHumidity: 55, defaultCondition: 'Breezy', defaultIcon: '🌤️' },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', region: 'Shivalik Foothills', lat: 30.7333, lng: 76.7794, defaultTempC: 26, defaultAqi: 74, defaultWindKmh: 9, defaultHumidity: 55, defaultCondition: 'Clear & Pleasant', defaultIcon: '☀️' },

  // ==========================================
  // 8. HIMALAYAS & NORTHERN HEIGHTS
  // ==========================================
  { id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', region: 'Garhwal Himalayas', lat: 30.0869, lng: 78.2676, defaultTempC: 24, defaultAqi: 38, defaultWindKmh: 12, defaultHumidity: 64, defaultCondition: 'Fresh Mountain Air', defaultIcon: '🏔️' },
  { id: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', region: 'Garhwal Gateway', lat: 29.9457, lng: 78.1642, defaultTempC: 25, defaultAqi: 55, defaultWindKmh: 10, defaultHumidity: 66, defaultCondition: 'River Breeze', defaultIcon: '🌤️' },
  { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', region: 'Doon Valley', lat: 30.3165, lng: 78.0322, defaultTempC: 25, defaultAqi: 65, defaultWindKmh: 10, defaultHumidity: 62, defaultCondition: 'Valley Breeze', defaultIcon: '🌤️' },
  { id: 'nainital', name: 'Nainital', state: 'Uttarakhand', region: 'Kumaon', lat: 29.3919, lng: 79.4542, defaultTempC: 18, defaultAqi: 28, defaultWindKmh: 14, defaultHumidity: 70, defaultCondition: 'Cool & Crisp', defaultIcon: '🌲' },
  { id: 'mussoorie', name: 'Mussoorie', state: 'Uttarakhand', region: 'Garhwal', lat: 30.4598, lng: 78.0644, defaultTempC: 17, defaultAqi: 24, defaultWindKmh: 15, defaultHumidity: 72, defaultCondition: 'Alpine Mist', defaultIcon: '🌫️' },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', region: 'Lower Himalayas', lat: 31.1048, lng: 77.1734, defaultTempC: 18, defaultAqi: 30, defaultWindKmh: 13, defaultHumidity: 65, defaultCondition: 'Crisp Pine Breeze', defaultIcon: '🌲' },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', region: 'Kullu Valley', lat: 32.2432, lng: 77.1892, defaultTempC: 14, defaultAqi: 20, defaultWindKmh: 15, defaultHumidity: 62, defaultCondition: 'Chilly & Sunny', defaultIcon: '❄️' },
  { id: 'dharamshala', name: 'Dharamshala', state: 'Himachal Pradesh', region: 'Kangra Valley', lat: 32.2190, lng: 76.3234, defaultTempC: 20, defaultAqi: 25, defaultWindKmh: 11, defaultHumidity: 68, defaultCondition: 'Clear Skies', defaultIcon: '☀️' },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', region: 'Kashmir Valley', lat: 34.0837, lng: 74.7973, defaultTempC: 19, defaultAqi: 34, defaultWindKmh: 8, defaultHumidity: 64, defaultCondition: 'Balmy & Clear', defaultIcon: '🌤️' },
  { id: 'gulmarg', name: 'Gulmarg', state: 'Jammu & Kashmir', region: 'Pir Panjal', lat: 34.0484, lng: 74.3805, defaultTempC: 11, defaultAqi: 15, defaultWindKmh: 18, defaultHumidity: 60, defaultCondition: 'Cold Alpine Air', defaultIcon: '❄️' },
  { id: 'leh', name: 'Leh', state: 'Ladakh', region: 'Indus Valley', lat: 34.1526, lng: 77.5771, defaultTempC: 12, defaultAqi: 18, defaultWindKmh: 22, defaultHumidity: 25, defaultCondition: 'High Altitude Sun', defaultIcon: '☀️' },

  // ==========================================
  // 9. SOUTH INDIA (KARNATAKA, KERALA, TN, AP, TELANGANA)
  // ==========================================
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', region: 'Mysore Plateau', lat: 12.9716, lng: 77.5946, defaultTempC: 27, defaultAqi: 58, defaultWindKmh: 15, defaultHumidity: 60, defaultCondition: 'Pleasant & Breezy', defaultIcon: '🌤️' },
  { id: 'mysuru', name: 'Mysuru', state: 'Karnataka', region: 'South Karnataka', lat: 12.2958, lng: 76.6394, defaultTempC: 28, defaultAqi: 42, defaultWindKmh: 12, defaultHumidity: 64, defaultCondition: 'Mild & Sunny', defaultIcon: '☀️' },
  { id: 'hampi', name: 'Hampi', state: 'Karnataka', region: 'Tungabhadra Basin', lat: 15.3350, lng: 76.4600, defaultTempC: 32, defaultAqi: 40, defaultWindKmh: 14, defaultHumidity: 45, defaultCondition: 'Warm & Sunny', defaultIcon: '☀️' },
  { id: 'mangaluru', name: 'Mangaluru', state: 'Karnataka', region: 'Kanara Coast', lat: 12.9141, lng: 74.8560, defaultTempC: 29, defaultAqi: 42, defaultWindKmh: 16, defaultHumidity: 80, defaultCondition: 'Coastal Air', defaultIcon: '🌴' },
  { id: 'gokarna', name: 'Gokarna', state: 'Karnataka', region: 'Uttara Kannada', lat: 14.5479, lng: 74.3188, defaultTempC: 29, defaultAqi: 32, defaultWindKmh: 16, defaultHumidity: 78, defaultCondition: 'Beach Breeze', defaultIcon: '🏖️' },
  { id: 'coorg', name: 'Coorg (Madikeri)', state: 'Karnataka', region: 'Western Ghats', lat: 12.4244, lng: 75.7382, defaultTempC: 21, defaultAqi: 20, defaultWindKmh: 13, defaultHumidity: 82, defaultCondition: 'Misty Coffee Hills', defaultIcon: '☕' },
  { id: 'hubballi', name: 'Hubballi-Dharwad', state: 'Karnataka', region: 'North Karnataka', lat: 15.3647, lng: 75.1240, defaultTempC: 29, defaultAqi: 52, defaultWindKmh: 13, defaultHumidity: 58, defaultCondition: 'Sunny', defaultIcon: '☀️' },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', region: 'Malabar Coast', lat: 9.9312, lng: 76.2673, defaultTempC: 30, defaultAqi: 36, defaultWindKmh: 16, defaultHumidity: 82, defaultCondition: 'Tropical Breeze', defaultIcon: '🌴' },
  { id: 'alleppey', name: 'Alleppey', state: 'Kerala', region: 'Vembanad Backwaters', lat: 9.4981, lng: 76.3388, defaultTempC: 30, defaultAqi: 30, defaultWindKmh: 14, defaultHumidity: 84, defaultCondition: 'Warm & Balmy', defaultIcon: '⛵' },
  { id: 'munnar', name: 'Munnar', state: 'Kerala', region: 'Anamalai Hills', lat: 10.0889, lng: 77.0595, defaultTempC: 19, defaultAqi: 18, defaultWindKmh: 13, defaultHumidity: 76, defaultCondition: 'Misty Tea Hills', defaultIcon: '🍃' },
  { id: 'varkala', name: 'Varkala', state: 'Kerala', region: 'South Malabar Coast', lat: 8.7379, lng: 76.7163, defaultTempC: 29, defaultAqi: 28, defaultWindKmh: 18, defaultHumidity: 80, defaultCondition: 'Ocean Breeze', defaultIcon: '🌊' },
  { id: 'kozhikode', name: 'Kozhikode', state: 'Kerala', region: 'Malabar', lat: 11.2588, lng: 75.7804, defaultTempC: 30, defaultAqi: 38, defaultWindKmh: 15, defaultHumidity: 80, defaultCondition: 'Coastal Sun', defaultIcon: '🌴' },
  { id: 'wayanad', name: 'Wayanad', state: 'Kerala', region: 'Western Ghats', lat: 11.6854, lng: 76.1320, defaultTempC: 22, defaultAqi: 22, defaultWindKmh: 12, defaultHumidity: 80, defaultCondition: 'Rainforest Mist', defaultIcon: '🌧️' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', region: 'Coromandel Coast', lat: 13.0827, lng: 80.2707, defaultTempC: 32, defaultAqi: 78, defaultWindKmh: 17, defaultHumidity: 76, defaultCondition: 'Warm Coastal Air', defaultIcon: '🌤️' },
  { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', region: 'Vaigai Basin', lat: 9.9252, lng: 78.1198, defaultTempC: 33, defaultAqi: 62, defaultWindKmh: 12, defaultHumidity: 58, defaultCondition: 'Sunny & Hot', defaultIcon: '☀️' },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', region: 'Kongu Nadu', lat: 11.0168, lng: 76.9558, defaultTempC: 29, defaultAqi: 48, defaultWindKmh: 14, defaultHumidity: 65, defaultCondition: 'Breezy & Warm', defaultIcon: '🌤️' },
  { id: 'ooty', name: 'Ooty', state: 'Tamil Nadu', region: 'Nilgiri Hills', lat: 11.4102, lng: 76.6950, defaultTempC: 16, defaultAqi: 18, defaultWindKmh: 15, defaultHumidity: 74, defaultCondition: 'Crisp Nilgiri Air', defaultIcon: '🌲' },
  { id: 'thanjavur', name: 'Thanjavur', state: 'Tamil Nadu', region: 'Cauvery Delta', lat: 10.7870, lng: 79.1378, defaultTempC: 32, defaultAqi: 52, defaultWindKmh: 13, defaultHumidity: 62, defaultCondition: 'Warm & Clear', defaultIcon: '☀️' },
  { id: 'kodaikanal', name: 'Kodaikanal', state: 'Tamil Nadu', region: 'Palani Hills', lat: 10.2381, lng: 77.4892, defaultTempC: 17, defaultAqi: 18, defaultWindKmh: 14, defaultHumidity: 75, defaultCondition: 'Pine Valley Mist', defaultIcon: '🌲' },
  { id: 'kanyakumari', name: 'Kanyakumari', state: 'Tamil Nadu', region: 'Indian Ocean Point', lat: 8.0883, lng: 77.5385, defaultTempC: 29, defaultAqi: 35, defaultWindKmh: 20, defaultHumidity: 78, defaultCondition: 'Tri-Sea Winds', defaultIcon: '🌅' },
  { id: 'rameswaram', name: 'Rameswaram', state: 'Tamil Nadu', region: 'Pamban Island', lat: 9.2876, lng: 79.3129, defaultTempC: 30, defaultAqi: 40, defaultWindKmh: 21, defaultHumidity: 76, defaultCondition: 'Island Breeze', defaultIcon: '🌊' },
  { id: 'pondicherry', name: 'Puducherry', state: 'Puducherry', region: 'Coromandel Coast', lat: 11.9416, lng: 79.8083, defaultTempC: 31, defaultAqi: 48, defaultWindKmh: 17, defaultHumidity: 78, defaultCondition: 'French Coast Sun', defaultIcon: '🏖️' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', region: 'Deccan Plateau', lat: 17.3850, lng: 78.4867, defaultTempC: 30, defaultAqi: 82, defaultWindKmh: 11, defaultHumidity: 55, defaultCondition: 'Partly Sunny', defaultIcon: '🌤️' },
  { id: 'warangal', name: 'Warangal', state: 'Telangana', region: 'Telangana Plateau', lat: 17.9689, lng: 79.5941, defaultTempC: 31, defaultAqi: 74, defaultWindKmh: 10, defaultHumidity: 54, defaultCondition: 'Clear & Bright', defaultIcon: '☀️' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', region: 'Eastern Ghats Coast', lat: 17.6868, lng: 83.2185, defaultTempC: 30, defaultAqi: 65, defaultWindKmh: 17, defaultHumidity: 75, defaultCondition: 'Coastal Breeze', defaultIcon: '🌊' },
  { id: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', region: 'Krishna Delta', lat: 16.5062, lng: 80.6480, defaultTempC: 32, defaultAqi: 78, defaultWindKmh: 12, defaultHumidity: 66, defaultCondition: 'Warm Sun', defaultIcon: '☀️' },
  { id: 'tirupati', name: 'Tirupati', state: 'Andhra Pradesh', region: 'Rayalaseema', lat: 13.6288, lng: 79.4192, defaultTempC: 31, defaultAqi: 55, defaultWindKmh: 13, defaultHumidity: 60, defaultCondition: 'Pleasant & Clear', defaultIcon: '☀️' },
];

export function getAqiCategory(aqi: number): { label: string; color: string; bg: string; border: string; text: string } {
  if (aqi <= 50) {
    return { label: 'Good', color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' };
  } else if (aqi <= 100) {
    return { label: 'Moderate', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' };
  } else if (aqi <= 150) {
    return { label: 'Poor', color: '#F97316', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' };
  } else if (aqi <= 200) {
    return { label: 'Unhealthy', color: '#EF4444', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700' };
  } else {
    return { label: 'Severe', color: '#9333EA', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' };
  }
}

export function getTemperatureCategory(tempC: number): { label: string; color: string; bg: string; border: string; text: string } {
  if (tempC >= 34) {
    return { label: 'Hot', color: '#DC2626', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' };
  } else if (tempC >= 27) {
    return { label: 'Warm', color: '#EA580C', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' };
  } else if (tempC >= 20) {
    return { label: 'Pleasant', color: '#D97706', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' };
  } else if (tempC >= 13) {
    return { label: 'Cool', color: '#0D9488', bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' };
  } else {
    return { label: 'Chilly', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' };
  }
}

export function getWindCategory(windKmh: number): { label: string; color: string; bg: string; border: string; text: string } {
  if (windKmh >= 20) {
    return { label: 'High Gusts', color: '#0369A1', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800' };
  } else if (windKmh >= 13) {
    return { label: 'Breezy', color: '#0284C7', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' };
  } else if (windKmh >= 7) {
    return { label: 'Moderate', color: '#0EA5E9', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' };
  } else {
    return { label: 'Calm', color: '#06B6D4', bg: 'bg-cyan-50/70', border: 'border-cyan-100', text: 'text-cyan-600' };
  }
}
