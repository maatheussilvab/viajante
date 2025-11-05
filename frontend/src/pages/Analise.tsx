import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

import jsPDF from "jspdf";

const resumoAnalitico = [
  {
    title: "1. Principais Descobertas",
    icon: TrendingUp,
    color: "text-primary",
    colorHex: "#2563EB", 
    points: [
      {
        title: "Forte Domínio do Canal Online",
        description: "O canal 'Online' (incluindo 'On-Line' e 'online') é o principal motor de receita e volume de reservas.",
      },
      {
        title: "Receita Distribuída",
        description: "A receita total é bem segmentada entre 'Pessoa Física', 'Corporativo' e 'Parceiro', sem uma dependência excessiva de um único segmento.",
      },
      {
        title: "Rentabilidade Oculta",
        description: "Os destinos com maior volume de reservas não são os mais lucrativos. A análise de margem média revela destinos de nicho com maior rentabilidade.",
      },
      {
        title: "Concentração Semestral (H1)",
        description: "O conjunto de dados está 100% concentrado no primeiro semestre (H1) de 2024. Não há nenhuma reserva registrada no segundo semestre (H2).",
      }
    ],
  },
  {
    title: "2. Recomendações Estratégicas",
    icon: CheckCircle,
    color: "text-green-600",
    colorHex: "#16A34A", 
    points: [
      {
        title: "Otimizar o Canal Online",
        description: "Focar na experiência do usuário e em marketing digital para capturar a demanda já existente e otimizar a conversão.",
      },
      {
        title: "Focar na Margem (Não no Volume)",
        description: "Criar campanhas de incentivo direcionadas aos destinos com maior margem média, mesmo que tenham menor volume.",
      },
      {
        title: "Análise de Sazonalidade (Urgente)",
        description: "Investigar imediatamente a ausência de dados de reserva no H2. Se for o comportamento real, a agência precisa de um plano de contingência agressivo para o H2.",
      },
      {
        title: "Segmentar a Fidelização",
        description: "Usar o indicador de fidelidade para criar ações de retenção personalizadas e reativar clientes de alto valor com baixa receita recente.",
      },
    ],
  },
  {
    title: "3. Riscos e Oportunidades",
    icon: AlertTriangle,
    color: "text-destructive",
    colorHex: "#DC2626", 
    points: [
      {
        title: "Risco: Integridade de Dados",
        description: "Foram encontrados dados nulos ('receita'), inconsistentes ('Online' vs 'online') e datas corrompidas. A padronização no backend (ETL) é crucial.",
      },
      {
        title: "Risco: Sazonalidade Extrema",
        description: "A ausência total de reservas no H2 é um ponto cego alarmante e um risco financeiro elevado.",
      },
      {
        title: "Oportunidade: Cross-sell",
        description: "Os dados de UF e Continente permitem identificar oportunidades de cross-selling (ex: ofertar 'Europa' para clientes de 'MG' que compram 'América do Norte').",
      },
    ],
  },
];

export default function AnalisePage() {

  const handleDownloadPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4'); 
    const margin = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const usableWidth = pageWidth - (margin * 2);
    let currentY = 15;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Interpretação Analítica", margin, currentY);
    currentY += 7;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100); 
    pdf.text("Resumo com conclusões, recomendações e riscos observados.", margin, currentY);
    currentY += 10;
    pdf.setTextColor(0, 0, 0); 

    resumoAnalitico.forEach((section, sectionIndex) => {
      
      if (sectionIndex > 0) {
        currentY += 4; 
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(section.colorHex);
      pdf.text(section.title, margin, currentY);
      currentY += 7;
      pdf.setTextColor(0, 0, 0); 

      section.points.forEach((point) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(point.title, margin + 5, currentY); 
        currentY += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        
        const descriptionLines = pdf.splitTextToSize(point.description, usableWidth - 5); 
        
        pdf.text(descriptionLines, margin + 5, currentY);
        currentY += (descriptionLines.length * 3.5) + 5;
      });
      currentY += 4;
    });

    pdf.save('relatorio-analitico.pdf');
  };
  
  return (
    <div className="flex flex-col gap-6 animate-content-fade-in">

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interpretação Analítica</h1>
          <p className="text-lg text-muted-foreground">
            Resumo com as principais conclusões, recomendações e riscos observados.
          </p>
        </div>
        <Button onClick={handleDownloadPDF} className="w-full sm:w-auto flex-shrink-0">
          <Download className="mr-2 h-4 w-4" />
          Baixar Relatório PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {resumoAnalitico.map((section) => (
          <Card key={section.title} className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <CardTitle className={cn("text-2xl flex items-center gap-3", section.color)}>
                <section.icon className="h-6 w-6" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-5">
                {section.points.map((point, index) => (
                  <li key={index} className="flex flex-col gap-1">
                    {point.title && (
                      <span className="font-semibold text-base text-foreground">
                        {point.title}
                      </span>
                    )}
                    <span className="text-base text-foreground/80">
                      {point.description}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}