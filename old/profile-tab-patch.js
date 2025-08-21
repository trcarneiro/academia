// Quick patch for profile-tab.js collectData function
// This will be applied manually

async collectData() {
    console.log('📊 Coletando dados do perfil...');
    
    // Validar antes de coletar
    if (!this.validateAllFields()) {
        throw new Error('Existem campos inválidos no perfil');
    }

    // Coletar dados atuais dos campos
    const currentData = {};
    Object.entries(this.fields).forEach(([fieldName, element]) => {
        if (element) {
            currentData[fieldName] = element.value.trim();
        }
    });

    // Transformar dados para formato esperado pelo backend
    const transformedData = { ...currentData };
    
    // Separar nome completo em firstName e lastName
    if (transformedData.name) {
        const nameParts = transformedData.name.trim().split(' ');
        transformedData.firstName = nameParts[0] || '';
        transformedData.lastName = nameParts.slice(1).join(' ') || '';
        delete transformedData.name; // Remove o campo 'name' original
    }

    console.log('🔄 Dados transformados para API:', transformedData);

    this.formData = transformedData;
    this.hasUnsavedChanges = false;
    
    return transformedData;
}
