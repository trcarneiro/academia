/**
 * Server Extensions - Adiciona endpoints que faltam ao servidor atual
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Add PUT endpoint for students
 */
function addStudentPutEndpoint(app) {
    app.put('/api/students/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            console.log(`📝 PUT /api/students/${id}`, updateData);

            // Get current student data
            const { data: currentStudent, error: fetchError } = await supabase
                .from('Student')
                .select(`
                    *,
                    user:User(*)
                `)
                .eq('id', id)
                .single();

            if (fetchError || !currentStudent) {
                return res.status(404).json({
                    success: false,
                    error: 'Student not found',
                    message: fetchError?.message || 'Student not found'
                });
            }

            // Prepare user update data
            const userUpdates = {};
            if (updateData.firstName !== undefined) userUpdates.firstName = updateData.firstName;
            if (updateData.lastName !== undefined) userUpdates.lastName = updateData.lastName;
            if (updateData.email !== undefined) userUpdates.email = updateData.email;
            if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;

            // Prepare student update data
            const studentUpdates = {};
            if (updateData.category !== undefined) studentUpdates.category = updateData.category;
            if (updateData.gender !== undefined) studentUpdates.gender = updateData.gender;
            if (updateData.physicalCondition !== undefined) studentUpdates.physicalCondition = updateData.physicalCondition;
            if (updateData.emergencyContact !== undefined) studentUpdates.emergencyContact = updateData.emergencyContact;
            if (updateData.medicalConditions !== undefined) studentUpdates.medicalConditions = updateData.medicalConditions;
            if (updateData.specialNeeds !== undefined) studentUpdates.specialNeeds = updateData.specialNeeds;
            if (updateData.isActive !== undefined) studentUpdates.isActive = updateData.isActive;

            let updateErrors = [];

            // Update user data if needed
            if (Object.keys(userUpdates).length > 0) {
                console.log('📤 Updating user data:', userUpdates);
                const { error: userError } = await supabase
                    .from('User')
                    .update(userUpdates)
                    .eq('id', currentStudent.userId);

                if (userError) {
                    updateErrors.push(`User update failed: ${userError.message}`);
                }
            }

            // Update student data if needed
            if (Object.keys(studentUpdates).length > 0) {
                console.log('📤 Updating student data:', studentUpdates);
                const { error: studentError } = await supabase
                    .from('Student')
                    .update(studentUpdates)
                    .eq('id', id);

                if (studentError) {
                    updateErrors.push(`Student update failed: ${studentError.message}`);
                }
            }

            if (updateErrors.length > 0) {
                return res.status(500).json({
                    success: false,
                    error: 'Update failed',
                    message: updateErrors.join(', ')
                });
            }

            // Fetch updated student data
            const { data: updatedStudent, error: refetchError } = await supabase
                .from('Student')
                .select(`
                    *,
                    user:User(
                        firstName,
                        lastName,
                        email,
                        phone,
                        avatarUrl,
                        isActive
                    ),
                    financialResponsible:FinancialResponsible(
                        name,
                        email,
                        phone
                    )
                `)
                .eq('id', id)
                .single();

            if (refetchError) {
                console.warn('⚠️ Refetch warning:', refetchError.message);
            }

            console.log('✅ Student updated successfully:', id);

            return res.json({
                success: true,
                data: updatedStudent,
                message: 'Student updated successfully'
            });

        } catch (error) {
            console.error('❌ PUT /api/students/:id error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    });
}

/**
 * Add extensions to Express app
 */
function addServerExtensions(app) {
    console.log('🔧 Adding server extensions...');
    
    addStudentPutEndpoint(app);
    
    console.log('✅ Server extensions added successfully');
}

module.exports = {
    addServerExtensions,
    addStudentPutEndpoint
};