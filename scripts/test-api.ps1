try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/students" -Method GET
    Write-Host "API funcionando! Encontrados" $response.data.Count "alunos"
    
    if ($response.data.Count -gt 0) {
        Write-Host "Primeiro aluno:"
        $firstStudent = $response.data[0]
        Write-Host "   ID:" $firstStudent.id
        Write-Host "   Nome:" $firstStudent.user.firstName $firstStudent.user.lastName
        Write-Host "   Categoria:" $firstStudent.category
    }
} catch {
    Write-Host "Erro ao acessar API:" $_.Exception.Message
}
