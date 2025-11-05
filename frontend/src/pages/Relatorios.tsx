import { useState, useRef } from "react";
import { uploadExcelFile, fetchReservasMensal } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, Loader2, BarChart, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Importar cn para classes condicionais

export default function RelatoriosPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uploadFileName, setUploadFileName] = useState<string>("");
    const [dataUploaded, setDataUploaded] = useState(false);

    const [reportPreview, setReportPreview] = useState<{ headers: string[]; data: any[] } | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handlePreviewReport = async () => {
        setPreviewLoading(true);
        try {
            const result = await fetchReservasMensal();
            
            if (result.length > 0) {
                setReportPreview({
                    headers: Object.keys(result[0]),
                    data: result.slice(0, 15)
                });
            } else {
                setReportPreview(null);
            }
        } catch (error) {
             setReportPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
             toast({ variant: "destructive", title: "Arquivo Inválido", description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)." });
            return;
        }

        setIsUploading(true);
        setUploadFileName(file.name);
        setDataUploaded(false);
        setReportPreview(null); 

        toast({
            title: "Upload iniciado",
            description: `Enviando ${file.name} para o servidor...`,
        });

        try {
            await uploadExcelFile(file);
            
            toast({
                variant: "default",
                className: "bg-green-600 text-white",
                title: "Sucesso!",
                description: `Banco de dados atualizado. Pré-visualizando dados...`,
            });
            setDataUploaded(true);
            handlePreviewReport();
            
        } catch (error: any) { // <-- ERRO CORRIGIDO AQUI (removido o '=')
            toast({ variant: "destructive", title: "Erro Crítico no Servidor", description: error.message });
            setDataUploaded(false);
        } finally {
            setIsUploading(false);
            if (event.target) event.target.value = "";
        }
    };
    
    const handleGenerateReport = async () => {
        setIsGenerating(true);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const downloadLink = document.createElement('a');
        
        downloadLink.href = "/relatorio_base.sql"; 
        downloadLink.download = "relatorio_base.sql"; 
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast({ title: "Relatório Gerado", description: "O download do arquivo 'relatorio_base.sql' foi iniciado." });
        
        setIsGenerating(false);
    };

    // Função auxiliar para a descrição do Passo 2
    const getStatusDescription = () => {
        if (isGenerating) return "Aguarde, o download iniciará em breve...";
        if (dataUploaded) return "A base de dados foi processada. Clique abaixo para baixar o arquivo .sql final.";
        return "Aguardando o envio da base de dados no Passo 1.";
    };


    return (
        <div className="flex flex-col gap-6 animate-content-fade-in">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
            />
            
            <div>
                <h1 className="text-3xl font-bold">Gerador de Relatório SQL</h1>
                <p className="text-lg text-muted-foreground">
                    Siga os passos para gerar o relatório SQL final do desafio.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Coluna de Ações (Passo 1 e 2) */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    
                    {/* Passo 1: Upload */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold flex items-center gap-3">
                                <Upload className="h-5 w-5 text-primary" />
                                Passo 1: Enviar Base
                            </CardTitle>
                            <CardDescription>
                                Envie o arquivo <span className="font-semibold">base_agencia.xlsx</span>.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="flex flex-col gap-4">
                            <Button 
                                onClick={handleUploadClick} 
                                disabled={isUploading} 
                                variant="default"
                                className="w-full text-base h-12 font-semibold"
                            >
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                {isUploading ? "Enviando..." : (dataUploaded ? "Enviar Nova Base" : "Selecionar Arquivo")}
                            </Button>
                            
                            {isUploading && (
                                <div className="text-sm text-primary font-medium flex items-center gap-2 p-3 bg-secondary rounded-md border">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando {uploadFileName}...
                                </div>
                            )}

                            {dataUploaded && !isUploading && (
                                <div className="text-sm text-green-600 font-medium flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                                    <CheckCircle className="h-4 w-4" />
                                    Base '{uploadFileName}' carregada.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Passo 2: Download */}
                    <Card className={cn(
                        "shadow-md transition-all",
                        !dataUploaded && "bg-muted/50 border-dashed opacity-70"
                    )}>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold flex items-center gap-3">
                                <Download className="h-5 w-5 text-primary" />
                                Passo 2: Baixar Relatório
                            </CardTitle>
                            <CardDescription className={cn(dataUploaded && "text-primary font-medium")}>
                                {getStatusDescription()}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                            <Button
                                onClick={handleGenerateReport}
                                disabled={!dataUploaded || isGenerating}
                                variant="primary"
                                className="w-full text-base font-bold h-12"
                            >
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {isGenerating ? "Gerando..." : "Baixar Relatório .SQL"}
                            </Button>
                        </CardContent>
                    </Card>

                </div>

                {/* Coluna de Pré-visualização */}
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold flex items-center gap-3">
                            <BarChart className="h-5 w-5 text-primary"/>
                            Pré-Visualização: Receita Mensal (Pergunta A)
                        </CardTitle>
                        <CardDescription>
                       Uma prévia dos dados (até 15 linhas) após o upload da base.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PreviewTable 
                            preview={reportPreview} 
                            isLoading={previewLoading} 
                            dataUploaded={dataUploaded} 
                        />
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

// --- Componente PreviewTable (sem alterações) ---
interface PreviewTableProps {
    preview: { headers: string[]; data: any[] } | null;
    isLoading: boolean;
    dataUploaded: boolean;
}

function PreviewTable({ preview, isLoading, dataUploaded }: PreviewTableProps) {
    
    if (isLoading) {
        return (
             <div className="space-y-3 p-4 border rounded-md">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }
    
    if (!preview || preview.data.length === 0) {
        return (
             <div className="text-center text-muted-foreground py-10 border rounded-md bg-secondary/50">
                {dataUploaded ? "Nenhum dado encontrado para pré-visualização." : "Faça o upload do Excel para ver a prévia."}
            </div>
        );
    }

    const formatCell = (value: any): string => {
        if (typeof value === "number") {
            if (value > 1000 || String(value).includes('.')) { 
               return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        }
        if (value === null || value === undefined) {
            return "N/A";
        }
        return String(value).replace("T00:00:00", "");
    };

    return (
        <div className="border rounded-md overflow-x-auto shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                        {preview.headers.map((header) => (
                            <TableHead key={header} className="capitalize whitespace-nowrap text-primary font-semibold">
                                {header.replace(/_/g, " ")}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {preview.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {preview.headers.map((header) => (
                                <TableCell key={`${rowIndex}-${header}`} className="whitespace-nowrap">
                                    {formatCell(row[header])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}