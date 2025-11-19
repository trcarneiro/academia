# Script para adicionar campos reversos faltantes no Prisma schema
# Cada linha representa: "ModeloAlvo|NomeDoArray|TipoDoArray|NomeRelacao"

$relations = @"
Organization|activities|Activity[]|
Organization|activityCategories|ActivityCategory[]|
Organization|badges|Badge[]|
Organization|googleAdsCampaigns|GoogleAdsCampaign[]|
Organization|aiAgents|AIAgent[]|
Organization|agentInteractions|AgentInteraction[]|@relation("AgentInteractions")
Organization|agentPermissions|AgentPermission[]|@relation("AgentPermissions")
Organization|agentTasks|AgentTask[]|@relation("AgentTasks")
Organization|agentInsights|AgentInsight[]|@relation("AgentInsights")
Organization|leads|Lead[]|
Organization|agendaItems|AgendaItem[]|
Organization|turmas|Turma[]|
Organization|personalTrainingClasses|PersonalTrainingClass[]|
Course|assessmentDefinitions|AssessmentDefinition[]|
Course|teacherEvaluations|TeacherEvaluation[]|
Course|turmas|Turma[]|
Course|turmaCourses|TurmaCourse[]|
Course|personalTrainingSessions|PersonalTrainingSession[]|
Course|courseGraduationLevels|CourseGraduationLevel[]|
Course|studentDegreeHistories|StudentDegreeHistory[]|
Course|studentGraduations|StudentGraduation[]|
Course|studentProgresses|StudentProgress[]|
Course|courseRequirements|CourseRequirement[]|
Course|planCourses|PlanCourse[]|
ActivityCategory|activities|Activity[]|
Technique|activities|Activity[]|@relation("ActivityTechniqueRef")
Activity|lessonPlanActivities|LessonPlanActivity[]|
Activity|classActivities|ClassActivity[]|
LessonPlan|lessonPlanActivities|LessonPlanActivity[]|
LessonPlan|turmaLessons|TurmaLesson[]|
LessonPlan|personalTrainingSessions|PersonalTrainingSession[]|
Class|classActivities|ClassActivity[]|
Class|assessmentAttempts|AssessmentAttempt[]|
Class|physicalTestAttempts|PhysicalTestAttempt[]|
Class|feedbackLessons|FeedbackLesson[]|
Class|teacherEvaluations|TeacherEvaluation[]|
Rubric|rubricCriteria|RubricCriterion[]|
Rubric|assessmentDefinitions|AssessmentDefinition[]|
AssessmentDefinition|assessmentAttempts|AssessmentAttempt[]|
PhysicalTestDefinition|physicalTestAttempts|PhysicalTestAttempt[]|
ClassActivity|feedbackActivities|FeedbackActivity[]|
Student|assessmentAttempts|AssessmentAttempt[]|
Student|physicalTestAttempts|PhysicalTestAttempt[]|
Student|feedbackLessons|FeedbackLesson[]|
Student|feedbackActivities|FeedbackActivity[]|
Student|teacherEvaluations|TeacherEvaluation[]|
Student|badgeUnlocks|BadgeUnlock[]|
Student|pointsTransactions|PointsTransaction[]|
Student|turmaStudents|TurmaStudent[]|
Student|turmaAttendances|TurmaAttendance[]|
Student|personalTrainingClasses|PersonalTrainingClass[]|
Student|lessonActivityExecutions|LessonActivityExecution[]|
Student|studentDegreeHistories|StudentDegreeHistory[]|
Student|studentGraduations|StudentGraduation[]|
Student|agentConversations|AgentConversation[]|
Student|studentProgresses|StudentProgress[]|
Student|biometricAttempts|BiometricAttempt[]|
Badge|badgeUnlocks|BadgeUnlock[]|
User|turmas|Turma[]|
User|turmaAttendances|TurmaAttendance[]|@relation("AttendanceChecker")
User|agendaItems|AgendaItem[]|
User|leads|Lead[]|@relation("LeadAssignedTo")
User|leadActivities|LeadActivity[]|@relation("LeadActivities")
User|leadNotes|LeadNote[]|@relation("LeadNotes")
User|agentConversations|AgentConversation[]|
User|agentPermissions|AgentPermission[]|@relation("ApprovedPermissions")
User|createdTasks|AgentTask[]|@relation("CreatedTasks")
User|assignedTasks|AgentTask[]|@relation("AssignedTasks")
User|approvedTasks|AgentTask[]|@relation("ApprovedTasks")
User|executorTasks|AgentTask[]|@relation("ExecutorTasks")
User|taskExecutions|TaskExecution[]|@relation("TaskExecutions")
Turma|turmaLessons|TurmaLesson[]|
Turma|turmaStudents|TurmaStudent[]|
Turma|turmaAttendances|TurmaAttendance[]|
Turma|turmaCourses|TurmaCourse[]|
TrainingArea|turmas|Turma[]|@relation("TurmaTrainingArea")
TrainingArea|personalTrainingSessions|PersonalTrainingSession[]|@relation("PersonalSessionTrainingArea")
TrainingArea|agendaItems|AgendaItem[]|
Unit|turmas|Turma[]|
Unit|personalTrainingSessions|PersonalTrainingSession[]|
Unit|agendaItems|AgendaItem[]|
TurmaLesson|turmaAttendances|TurmaAttendance[]|
TurmaLesson|lessonActivityExecutions|LessonActivityExecution[]|
TurmaStudent|turmaAttendances|TurmaAttendance[]|
Instructor|teacherEvaluations|TeacherEvaluation[]|
Instructor|personalTrainingClasses|PersonalTrainingClass[]|
Instructor|lessonActivityExecutions|LessonActivityExecution[]|@relation("ActivityValidation")
Instructor|qualitativeAssessments|QualitativeAssessment[]|
PersonalTrainingClass|personalTrainingSessions|PersonalTrainingSession[]|
Lead|leadActivities|LeadActivity[]|
Lead|leadNotes|LeadNote[]|
GoogleAdsCampaign|googleAdsAdGroups|GoogleAdsAdGroup[]|
GoogleAdsAdGroup|googleAdsKeywords|GoogleAdsKeyword[]|
LessonPlanActivity|lessonActivityExecutions|LessonActivityExecution[]|
TurmaAttendance|lessonActivityExecutions|LessonActivityExecution[]|
AIAgent|agentConversations|AgentConversation[]|
AIAgent|agentInteractions|AgentInteraction[]|@relation("AgentInteractions")
AIAgent|agentPermissions|AgentPermission[]|@relation("AgentPermissions")
AIAgent|agentTasks|AgentTask[]|@relation("AgentTasks")
AIAgent|agentInsights|AgentInsight[]|@relation("AgentInsights")
AgentTask|taskExecutions|TaskExecution[]|@relation("TaskExecutions")
StudentProgress|qualitativeAssessments|QualitativeAssessment[]|
BillingPlan|planCourses|PlanCourse[]|@relation("PlanCourseToPlan")
"@

Write-Host "Analisando schema..." -ForegroundColor Cyan
$schemaPath = "h:\projetos\academia\prisma\schema.prisma"
$schemaContent = Get-Content $schemaPath -Raw

$relationArray = $relations -split "`n" | Where-Object { $_.Trim() -ne "" }
$totalRelations = $relationArray.Count
$addedCount = 0

Write-Host "Total de relacionamentos a adicionar: $totalRelations" -ForegroundColor Yellow

foreach ($line in $relationArray) {
    $parts = $line.Trim() -split '\|'
    $modelName = $parts[0]
    $fieldName = $parts[1]
    $fieldType = $parts[2]
    $relationAttr = if ($parts.Count -gt 3) { " " + $parts[3] } else { "" }
    
    # Encontrar o modelo
    if ($schemaContent -match "(?ms)(model\s+$modelName\s*\{.*?\n\})") {
        $modelBlock = $matches[1]
        
        # Verificar se o campo já existe
        if ($modelBlock -notmatch "\s+$fieldName\s+") {
            Write-Host "  + Adicionando $fieldName em $modelName" -ForegroundColor Green
            
            # Encontrar a última linha antes do fechamento do modelo
            $insertPoint = $modelBlock.LastIndexOf('}')
            $beforeClose = $modelBlock.Substring(0, $insertPoint)
            $afterClose = $modelBlock.Substring($insertPoint)
            
            # Adicionar o novo campo
            $newField = "  $fieldName $fieldType$relationAttr`n"
            $newModelBlock = $beforeClose + $newField + $afterClose
            
            # Substituir no conteúdo
            $schemaContent = $schemaContent.Replace($modelBlock, $newModelBlock)
            $addedCount++
        } else {
            Write-Host "  - Campo $fieldName já existe em $modelName" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  ! Modelo $modelName não encontrado" -ForegroundColor Red
    }
}

Write-Host "`nSalvando schema..." -ForegroundColor Cyan
Set-Content $schemaPath -Value $schemaContent -Encoding UTF8

Write-Host "`nConcluído! Adicionados: $addedCount de $totalRelations campos" -ForegroundColor Green
Write-Host "Execute 'npx prisma format' e 'npx prisma validate' para verificar" -ForegroundColor Yellow
