const API_BASE_URL = 'http://localhost:5000/api';

async function testActualMapping() {
  try {
    // Login
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const { token } = await loginRes.json();
    console.log('✅ Login successful');

    // Test the preview endpoint to see what mapping is being used
    const formData = new FormData();
    
    // Create a simple CSV with your exact headers
    const csvContent = `sku,name,short_description,description,brand,mfn,stock,list_price,market_price,vendor_cost,special_price,weight,length,width,height,google_category,vendor_category,store_category,vendor_subcategory_1,vendor_subcategory_2,vendor_subcategory_3,vendor_subcategory_4,store_subcategory_1,store_subcategory_2,store_subcategory_3,store_subcategory_4,published,featured,visibility,vendor_id,meta_title,meta_description,meta_keywords
SKU-0001,Test Product,Test description,Full description,Brand,,10,100,120,80,90,1,10,10,10,Electronics > Audio,Audio,Electronics,Speakers,Headphones,,,Speakers,Headphones,,,1,1,public,VEND001,Test Title,Test Meta,test,keywords`;

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', csvBlob, 'test.csv');

    console.log('📤 Sending CSV to preview endpoint...');
    
    const previewRes = await fetch(`${API_BASE_URL}/products/preview`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!previewRes.ok) {
      const error = await previewRes.text();
      console.error('❌ Preview failed:', error);
      return;
    }

    const previewData = await previewRes.json();
    console.log('✅ Preview successful');
    console.log('📊 Preview data:', JSON.stringify(previewData, null, 2));

    // Check the mapped fields
    if (previewData.mappedFields) {
      console.log(`\n🔍 Mapped fields count: ${previewData.mappedFields}`);
    }

    // Check the preview rows to see the mapping
    if (previewData.previewRows && previewData.previewRows.length > 0) {
      console.log('\n📋 First row mapping:');
      const firstRow = previewData.previewRows[0];
      console.log('Original:', firstRow.original);
      console.log('Mapped:', firstRow.mapped);
      
      if (firstRow.categoryInfo) {
        console.log('Category Info:', firstRow.categoryInfo);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActualMapping();
