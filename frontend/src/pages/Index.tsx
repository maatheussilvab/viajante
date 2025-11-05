import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription, // Corrigido: Adicionado CardDescription
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Upload, 
  Search, 
  LineChart as LineChartIcon, 
  BarChart as BarChartIcon,
  Package,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Filter
} from "lucide-react";
import {
  fetchReservasFiltradas,
  fetchReservasMensal,
  fetchDestinosRentabilidade,
  uploadExcelFile,
  type ReservaFiltrada,
  type ReservaMensal,
  type DestinoRentabilidade,
} from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/PageHeader";

type KPIs = {
  reservas: number;
  receita: number;
  custo: number;
  margem: number;
};

const SazonalidadeChartConfig = {
  receita_total: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
  total_reservas: {
    label: "Reservas",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const RentabilidadeChartConfig = {
  margem_media: {
    label: "Margem Média",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function PowerBIDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [sazonalidadeData, setSazonalidadeData] = useState<ReservaMensal[]>([]);
  const [rentabilidadeData, setRentabilidadeData] = useState<DestinoRentabilidade[]>([]);
  const [reservasData, setReservasData] = useState<ReservaFiltrada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    mes: "",
    cliente: "",
    destino: "",
    canal: "",
    uf: "",
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sazonalidade, rentabilidade, reservas] = await Promise.all([
        fetchReservasMensal(),
        fetchDestinosRentabilidade(),
        fetchReservasFiltradas(new URLSearchParams()),
      ]);

      setSazonalidadeData(sazonalidade);
      setRentabilidadeData(rentabilidade);
      setReservasData(reservas);
      calculateKPIs(reservas);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dashboard",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const calculateKPIs = (data: ReservaFiltrada[]) => {
    const receita = data.reduce((acc, r) => acc + (r.receita || 0), 0);
    const custo = data.reduce((acc, r) => acc + (r.custo || 0), 0);
    setKpis({
      reservas: data.length,
      receita: receita,
      custo: custo,
      margem: receita - custo,
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.mes) params.append("mes", filters.mes);
      if (filters.cliente) params.append("cliente", filters.cliente);
      if (filters.destino) params.append("destino", filters.destino);
      if (filters.canal) params.append("canal", filters.canal);
      if (filters.uf) params.append("uf", filters.uf);
      
      const reservas = await fetchReservasFiltradas(params);
      setReservasData(reservas);
      calculateKPIs(reservas);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao aplicar filtros",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({
      title: "Upload iniciado",
      description: `Enviando ${file.name}...`,
    });

    try {
      const response = await uploadExcelFile(file);
      toast({
        variant: "default",
        className: "bg-green-600 text-white",
        title: "Sucesso!",
        description: `Banco de dados atualizado. ${response.reservas_importadas} reservas carregadas.`,
      });
      loadDashboardData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = "";
    }
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
      
      <PageHeader
        title="Dashboard Interativo"
        description="Acompanhe os principais indicadores de performance e filtre os dados da base."
      >
        <Button onClick={handleUploadClick} disabled={isUploading} variant="default" className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Enviando..." : "Upload (base_agencia.xlsx)"}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href="/dashboard_interativo_cvc.pbix" download="dashboard_interativo_cvc.pbix">
            <Download className="mr-2 h-4 w-4" />
            Baixar .pbix
          </a>
        </Button>
      </PageHeader>

      <VisaoGeral kpis={kpis} isLoading={isLoading} />

      <Accordion type="single" collapsible defaultValue="item-1" className="w-full bg-secondary rounded-lg border-none">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="text-2xl font-bold px-6 py-4 [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-primary" />
              Filtros da Análise
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <form onSubmit={handleFilterSubmit} className="px-6 pb-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="space-y-1.5">
                  <label htmlFor="mes" className="text-sm font-medium text-primary">Mês (AAAA-MM)</label>
                  <Input id="mes" name="mes" placeholder="Ex: 2024-05" value={filters.mes} onChange={handleFilterChange} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cliente" className="text-sm font-medium text-primary">Cliente</label>
                  <Input id="cliente" name="cliente" placeholder="Nome do Cliente" value={filters.cliente} onChange={handleFilterChange} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="destino" className="text-sm font-medium text-primary">Destino</label>
                  <Input id="destino" name="destino" placeholder="Nome do Destino" value={filters.destino} onChange={handleFilterChange} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="canal" className="text-sm font-medium text-primary">Canal</label>
                  <Input id="canal" name="canal" placeholder="Ex: Online" value={filters.canal} onChange={handleFilterChange} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="uf" className="text-sm font-medium text-primary">UF</label>
                  <Input id="uf" name="uf" placeholder="Ex: SP" value={filters.uf} onChange={handleFilterChange} />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} variant="primary" size="lg">
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Buscando..." : "Aplicar Filtros"}
                </Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoSazonalidade data={sazonalidadeData} isLoading={isLoading} />
        <GraficoRentabilidade data={rentabilidadeData} isLoading={isLoading} />
      </div>
      
      <TabelaReservas data={reservasData} isLoading={isLoading} />
    </div>
  );
}

function VisaoGeral({ kpis, isLoading }: { kpis: KPIs | null; isLoading: boolean }) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  const kpiItems = [
    { title: "Total de Reservas", value: kpis.reservas.toLocaleString("pt-BR"), icon: Package },
    { title: "Receita Total", value: kpis.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), icon: DollarSign },
    { title: "Custo Total", value: kpis.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), icon: ClipboardList },
    { title: "Margem Total", value: kpis.margem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiItems.map((item) => (
        <Card key={item.title} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">{item.title}</CardTitle>
            <item.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GraficoSazonalidade({ data, isLoading }: { data: ReservaMensal[]; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-80" />;
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <LineChartIcon className="w-5 h-5" />
          Evolução Mensal (Sazonalidade)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={SazonalidadeChartConfig} className="h-64">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis yAxisId="left" stroke="var(--color-receita_total)" />
            <YAxis yAxisId="right" orientation="right" stroke="var(--color-total_reservas)" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line yAxisId="left" type="monotone" dataKey="receita_total" stroke="var(--color-receita_total)" strokeWidth={2} name="Receita" />
            <Line yAxisId="right" type="monotone" dataKey="total_reservas" stroke="var(--color-total_reservas)" strokeWidth={2} name="Reservas" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function GraficoRentabilidade({ data, isLoading }: { data: DestinoRentabilidade[]; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-80" />;
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        {/* --- TÍTULO ATUALIZADO AQUI --- */}
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChartIcon className="w-5 h-5" />
          Top 5 Destinos Rentáveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={RentabilidadeChartConfig} className="h-64">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis dataKey="destino" type="category" tick={{ fontSize: 12 }} />
            <XAxis dataKey="margem_media" type="number" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="margem_media" fill="var(--color-margem_media)" name="Margem Média" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function TabelaReservas({ data, isLoading }: { data: ReservaFiltrada[]; isLoading: boolean }) {
  const [quickFilter, setQuickFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredData = useMemo(() => {
    if (isLoading) return [];
    if (!quickFilter) return data;
    
    const lowerCaseFilter = quickFilter.toLowerCase();
    
    return data.filter(item =>
      item.cliente.toLowerCase().includes(lowerCaseFilter) ||
      item.destino.toLowerCase().includes(lowerCaseFilter)
    );
  }, [data, quickFilter, isLoading]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <CardTitle>Detalhamento das Reservas</CardTitle>
        <Input
          placeholder="Filtrar por cliente ou destino..."
          value={quickFilter}
          onChange={(e) => {
            setQuickFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm w-full md:w-auto"
        />
      </CardHeader>
      <CardContent>
        <div className="border rounded-md hidden md:block">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead>ID Reserva</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {data.length === 0 ? "Nenhum resultado encontrado." : "Nenhum resultado para esta busca."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((reserva) => (
                  <TableRow key={reserva.id_reserva}>
                    <TableCell>{reserva.id_reserva}</TableCell>
                    <TableCell>{reserva.cliente}</TableCell>
                    <TableCell>{reserva.destino}</TableCell>
                    <TableCell>{reserva.canal_venda}</TableCell>
                    <TableCell>{reserva.receita?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>{reserva.custo?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="block md:hidden space-y-4">
          {paginatedData.length === 0 ? (
             <div className="h-24 text-center flex items-center justify-center text-muted-foreground border rounded-md">
                {data.length === 0 ? "Nenhum resultado encontrado." : "Nenhum resultado para esta busca."}
             </div>
          ) : (
            paginatedData.map((reserva) => (
              <Card key={reserva.id_reserva} className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{reserva.cliente}</CardTitle>
                    <CardDescription>ID Reserva: {reserva.id_reserva}</CardDescription>
                  </div>
                  <div className="text-right flex-shrink-0 pl-4">
                     <p className="text-lg font-bold text-primary">{reserva.receita?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                     <p className="text-sm text-destructive">- {reserva.custo?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Destino:</strong> {reserva.destino}</p>
                  <p><strong>Canal:</strong> {reserva.canal_venda}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    Anterior
                  </PaginationPrevious>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 py-2 text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  >
                    Próximo
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}