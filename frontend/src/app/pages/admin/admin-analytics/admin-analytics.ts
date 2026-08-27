import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  TooltipItem,
} from 'chart.js';

import { AdminAnalyticsService } from '../../../services/admin-analytics.service';
import { AdminProductService } from '../../../services/admin-product.service';
import { AuthService } from '../../../services/auth.service';
import { CurrencyService } from '../../../services/currency.service';
import {
  Analytics,
  AnalyticsTimeSeries,
  ParticipantHours,
  ProductionAnalytics,
  ProductionPeriodAnalytics,
} from '../../../models/analytics.model';
import { OrderStatus } from '../../../models/order.model';
import { Product } from '../../../models/product.model';
import { DsButtonComponent } from '../../../design-system/components/ds-button/ds-button.component';
import { DsModalComponent } from '../../../design-system/components/ds-modal/ds-modal.component';
import { DsSectionHeaderComponent } from '../../../design-system/components/ds-section-header/ds-section-header.component';

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

const STATUS_LABELS: Record<OrderStatus, string> = {
  RESERVED: 'Réservée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

/** Order-flow order (badges on the "Orders" page), not alphabetical order. */
const STATUS_ORDER: OrderStatus[] = ['RESERVED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

/** Validated categorical palette (eight hues, contrast + CVD confirmed against --gz-surface). */
const PRODUCT_COLORS = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];

const ALL_PRODUCTS = 'ALL';

interface StatTile {
  label: string;
  value: string;
}

interface PeriodStatTile {
  label: string;
  value: string;
  trend?: { direction: 'up' | 'down'; label: string };
}

interface StatusCount {
  status: OrderStatus;
  label: string;
  count: number;
}

interface ChartTheme {
  accent: string;
  sage: string;
  textSecondary: string;
  textPrimary: string;
  gridline: string;
  surface: string;
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
}

function toIsoDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toIsoDateInputValue(date);
}

function defaultEndDate(): string {
  return toIsoDateInputValue(new Date());
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

@Component({
  selector: 'app-admin-analytics',
  imports: [DsSectionHeaderComponent, DsButtonComponent, DsModalComponent, RouterLink],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.scss',
})
export class AdminAnalytics implements OnInit, OnDestroy {
  private readonly analyticsService = inject(AdminAnalyticsService);
  private readonly productService = inject(AdminProductService);
  private readonly authService = inject(AuthService);
  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  private readonly statusCanvas = viewChild<ElementRef<HTMLCanvasElement>>('statusChart');
  private readonly revenueCanvas = viewChild<ElementRef<HTMLCanvasElement>>('revenueChart');
  private readonly ordersCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ordersChart');
  private readonly customersCanvas = viewChild<ElementRef<HTMLCanvasElement>>('customersChart');
  private readonly gyozaCanvas = viewChild<ElementRef<HTMLCanvasElement>>('gyozaChart');
  private readonly sessionCostCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sessionCostChart');
  private readonly flavorCostCanvas = viewChild<ElementRef<HTMLCanvasElement>>('flavorCostChart');
  private readonly periodHourlyRevenueCanvas = viewChild<ElementRef<HTMLCanvasElement>>('periodHourlyRevenueChart');
  private readonly periodProfitCanvas = viewChild<ElementRef<HTMLCanvasElement>>('periodProfitChart');
  private readonly participantHoursCanvas = viewChild<ElementRef<HTMLCanvasElement>>('participantHoursChart');
  private readonly stockByFlavorCanvas = viewChild<ElementRef<HTMLCanvasElement>>('stockByFlavorChart');

  private statusChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private ordersChart: Chart | null = null;
  private customersChart: Chart | null = null;
  private gyozaChart: Chart | null = null;
  private sessionCostChart: Chart | null = null;
  private flavorCostChart: Chart | null = null;
  private periodHourlyRevenueChart: Chart | null = null;
  private periodProfitChart: Chart | null = null;
  private participantHoursChart: Chart | null = null;
  private stockByFlavorChart: Chart | null = null;

  protected readonly statusOrder = STATUS_ORDER;
  protected readonly allProducts = ALL_PRODUCTS;

  protected readonly analytics = signal<Analytics | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly selectedProduct = signal<string>(ALL_PRODUCTS);

  protected readonly startDate = signal(defaultStartDate());
  protected readonly endDate = signal(defaultEndDate());
  protected readonly timeSeries = signal<AnalyticsTimeSeries | null>(null);
  protected readonly timeSeriesLoading = signal(true);
  protected readonly timeSeriesLoadError = signal<string | null>(null);

  protected readonly productionAnalytics = signal<ProductionAnalytics | null>(null);
  protected readonly productionAnalyticsLoading = signal(true);
  protected readonly productionAnalyticsLoadError = signal<string | null>(null);

  protected readonly productionPeriodAnalytics = signal<ProductionPeriodAnalytics | null>(null);
  protected readonly productionPeriodLoading = signal(true);
  protected readonly productionPeriodLoadError = signal<string | null>(null);

  protected readonly products = signal<Product[]>([]);
  protected readonly productsLoading = signal(true);
  protected readonly productsLoadError = signal<string | null>(null);

  protected readonly rangeInvalid = computed(() => this.startDate() > this.endDate());

  protected readonly exportDialogOpen = signal(false);
  protected readonly exportStartDate = signal(defaultStartDate());
  protected readonly exportEndDate = signal(defaultEndDate());
  protected readonly exporting = signal(false);
  protected readonly exportError = signal<string | null>(null);
  protected readonly exportRangeInvalid = computed(() => this.exportStartDate() > this.exportEndDate());

  protected readonly statTiles = computed<StatTile[]>(() => {
    const data = this.analytics();

    if (!data) {
      return [];
    }

    return [
      { label: 'Clients au total', value: data.totalCustomers.toLocaleString('fr-CH') },
      { label: 'Commandes au total', value: data.totalOrders.toLocaleString('fr-CH') },
      { label: 'Panier moyen', value: this.currencyService.format(data.averageOrderValue) },
    ];
  });

  protected readonly statusCounts = computed<StatusCount[]>(() => {
    const data = this.analytics();

    if (!data) {
      return [];
    }

    return this.statusOrder.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: data.ordersByStatus[status] ?? 0,
    }));
  });

  protected readonly dayLabels = computed(() =>
    (this.timeSeries()?.days ?? []).map((day) => formatShortDate(day.date)),
  );

  protected readonly productNames = computed(() => {
    const days = this.timeSeries()?.days ?? [];
    const names = new Set<string>();

    for (const day of days) {
      for (const name of Object.keys(day.unitsByProduct)) {
        names.add(name);
      }
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b, 'fr'));
  });

  protected readonly productColors = computed(() => {
    const map = new Map<string, string>();
    this.productNames().forEach((name, index) => {
      map.set(name, PRODUCT_COLORS[index % PRODUCT_COLORS.length]);
    });
    return map;
  });

  protected readonly productionStatTiles = computed<StatTile[]>(() => {
    const data = this.productionAnalytics();

    if (!data) {
      return [];
    }

    return [
      { label: 'Coût matière première total', value: this.currencyService.format(data.totalMaterialCost) },
      { label: 'Bénéfice net total (théorique)', value: this.currencyService.format(data.totalNetProfit) },
      { label: 'Coût matière / gyoza (moyen)', value: this.currencyService.format(data.averageMaterialCostPerGyoza) },
      // "Réel" — only counts orders that reached DELIVERED, unlike the totals above which are
      // frozen catalog-based estimates. See ProductionSessionCostCalculator.actualSummary.
      { label: 'CA réel (commandes livrées)', value: this.currencyService.format(data.totalActualRevenue) },
      { label: 'Bénéfice net réel', value: this.currencyService.format(data.totalActualNetProfit) },
    ];
  });

  protected readonly flavorNames = computed(() =>
    Object.keys(this.productionAnalytics()?.averageCostPerGyozaByFlavor ?? {}).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    ),
  );

  private flavorColorFor(index: number): string {
    return PRODUCT_COLORS[index % PRODUCT_COLORS.length];
  }

  protected readonly periodStatTiles = computed<PeriodStatTile[]>(() => {
    const data = this.productionPeriodAnalytics();

    if (!data) {
      return [];
    }

    return [
      {
        label: 'Revenu horaire moyen',
        value: `${this.currencyService.format(data.averageHourlyRevenue)}/h`,
        trend: this.trendFor(data.averageHourlyRevenueChangePercent),
      },
      {
        label: 'Coût matière / gyoza (moyen)',
        value: this.currencyService.format(data.averageMaterialCostPerGyoza),
        trend: this.trendFor(data.averageMaterialCostPerGyozaChangePercent),
      },
      { label: 'Bénéfice brut cumulé', value: this.currencyService.format(data.totalGrossProfit) },
      { label: 'Bénéfice net cumulé', value: this.currencyService.format(data.totalNetProfit) },
    ];
  });

  private trendFor(changePercent: number | null): PeriodStatTile['trend'] {
    if (changePercent === null) {
      return undefined;
    }

    const direction = changePercent >= 0 ? 'up' : 'down';
    const arrow = direction === 'up' ? '↑' : '↓';
    const magnitude = Math.abs(changePercent).toLocaleString('fr-CH', { maximumFractionDigits: 1 });

    return { direction, label: `${arrow} ${magnitude} % vs période précédente` };
  }

  protected readonly sortedProducts = computed(() =>
    [...this.products()].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  );

  constructor() {
    effect(() => {
      const counts = this.statusCounts();
      const canvas = this.statusCanvas()?.nativeElement;

      if (canvas && counts.length > 0) {
        this.renderStatusChart(canvas, counts);
      }
    });

    effect(() => {
      const days = this.timeSeries()?.days;
      const canvas = this.revenueCanvas()?.nativeElement;

      if (canvas && days) {
        this.renderRevenueChart(canvas, this.dayLabels(), days.map((day) => day.revenue));
      }
    });

    effect(() => {
      const days = this.timeSeries()?.days;
      const canvas = this.ordersCanvas()?.nativeElement;

      if (canvas && days) {
        this.renderOrdersChart(canvas, this.dayLabels(), days.map((day) => day.orderCount));
      }
    });

    effect(() => {
      const days = this.timeSeries()?.days;
      const canvas = this.customersCanvas()?.nativeElement;

      if (canvas && days) {
        this.renderCustomersChart(canvas, this.dayLabels(), days.map((day) => day.newCustomerCount));
      }
    });

    effect(() => {
      const days = this.timeSeries()?.days;
      const canvas = this.gyozaCanvas()?.nativeElement;

      if (canvas && days) {
        this.renderGyozaChart(canvas, days);
      }
    });

    effect(() => {
      const sessions = this.productionAnalytics()?.sessions;
      const canvas = this.sessionCostCanvas()?.nativeElement;

      if (canvas && sessions) {
        this.renderSessionCostChart(canvas, sessions);
      }
    });

    effect(() => {
      const data = this.productionAnalytics();
      const canvas = this.flavorCostCanvas()?.nativeElement;

      if (canvas && data) {
        this.renderFlavorCostChart(canvas, this.flavorNames(), data.averageCostPerGyozaByFlavor);
      }
    });

    effect(() => {
      const sessions = this.productionPeriodAnalytics()?.sessions;
      const canvas = this.periodHourlyRevenueCanvas()?.nativeElement;

      if (canvas && sessions) {
        this.renderPeriodHourlyRevenueChart(canvas, sessions);
      }
    });

    effect(() => {
      const sessions = this.productionPeriodAnalytics()?.sessions;
      const canvas = this.periodProfitCanvas()?.nativeElement;

      if (canvas && sessions) {
        this.renderPeriodProfitChart(canvas, sessions);
      }
    });

    effect(() => {
      const participantHours = this.productionPeriodAnalytics()?.participantHours;
      const canvas = this.participantHoursCanvas()?.nativeElement;

      if (canvas && participantHours) {
        this.renderParticipantHoursChart(canvas, participantHours);
      }
    });

    effect(() => {
      const products = this.sortedProducts();
      const canvas = this.stockByFlavorCanvas()?.nativeElement;

      if (canvas && products.length > 0) {
        this.renderStockByFlavorChart(canvas, products);
      }
    });
  }

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadTimeSeries();
    this.loadProductionAnalytics();
    this.loadProductionPeriodAnalytics();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.revenueChart?.destroy();
    this.ordersChart?.destroy();
    this.customersChart?.destroy();
    this.gyozaChart?.destroy();
    this.sessionCostChart?.destroy();
    this.flavorCostChart?.destroy();
    this.periodHourlyRevenueChart?.destroy();
    this.periodProfitChart?.destroy();
    this.participantHoursChart?.destroy();
    this.stockByFlavorChart?.destroy();
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }

  protected selectProduct(product: string): void {
    this.selectedProduct.set(product);
  }

  protected colorFor(product: string): string {
    return this.productColors().get(product) ?? PRODUCT_COLORS[0];
  }

  protected onStartDateChange(value: string): void {
    this.startDate.set(value);
  }

  protected onEndDateChange(value: string): void {
    this.endDate.set(value);
  }

  protected applyDateRange(): void {
    if (this.rangeInvalid()) {
      return;
    }

    this.loadTimeSeries();
    this.loadProductionPeriodAnalytics();
  }

  protected selectPeriodPreset(preset: 'week' | 'month' | 'year'): void {
    const today = new Date();
    const start =
      preset === 'week' ? startOfWeek(today) : preset === 'month' ? startOfMonth(today) : startOfYear(today);

    this.startDate.set(toIsoDateInputValue(start));
    this.endDate.set(toIsoDateInputValue(today));
    this.loadTimeSeries();
    this.loadProductionPeriodAnalytics();
  }

  protected openExportDialog(): void {
    this.exportStartDate.set(this.startDate());
    this.exportEndDate.set(this.endDate());
    this.exportError.set(null);
    this.exportDialogOpen.set(true);
  }

  protected closeExportDialog(): void {
    this.exportDialogOpen.set(false);
  }

  protected onExportStartDateChange(value: string): void {
    this.exportStartDate.set(value);
  }

  protected onExportEndDateChange(value: string): void {
    this.exportEndDate.set(value);
  }

  protected selectExportPeriodPreset(preset: 'week' | 'month'): void {
    const today = new Date();
    const start = preset === 'week' ? startOfWeek(today) : startOfMonth(today);

    this.exportStartDate.set(toIsoDateInputValue(start));
    this.exportEndDate.set(toIsoDateInputValue(today));
  }

  protected async confirmExport(): Promise<void> {
    if (this.exportRangeInvalid()) {
      return;
    }

    this.exporting.set(true);
    this.exportError.set(null);

    try {
      const blob = await firstValueFrom(
        this.analyticsService.exportPdf(this.exportStartDate(), this.exportEndDate()),
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${this.exportStartDate()}_${this.exportEndDate()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      this.exportDialogOpen.set(false);
    } catch (error) {
      this.exportError.set(this.extractErrorMessage(error));
    } finally {
      this.exporting.set(false);
    }
  }

  private async loadAnalytics(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const analytics = await firstValueFrom(this.analyticsService.getAnalytics());
      this.analytics.set(analytics);
    } catch {
      this.loadError.set('Impossible de charger les statistiques.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTimeSeries(): Promise<void> {
    this.timeSeriesLoading.set(true);
    this.timeSeriesLoadError.set(null);

    try {
      const timeSeries = await firstValueFrom(
        this.analyticsService.getTimeSeries(this.startDate(), this.endDate()),
      );
      this.timeSeries.set(timeSeries);
    } catch (error) {
      this.timeSeriesLoadError.set(this.extractErrorMessage(error));
    } finally {
      this.timeSeriesLoading.set(false);
    }
  }

  private async loadProductionAnalytics(): Promise<void> {
    this.productionAnalyticsLoading.set(true);
    this.productionAnalyticsLoadError.set(null);

    try {
      const data = await firstValueFrom(this.analyticsService.getProductionAnalytics());
      this.productionAnalytics.set(data);
    } catch {
      this.productionAnalyticsLoadError.set('Impossible de charger la rentabilité de production.');
    } finally {
      this.productionAnalyticsLoading.set(false);
    }
  }

  private async loadProductionPeriodAnalytics(): Promise<void> {
    this.productionPeriodLoading.set(true);
    this.productionPeriodLoadError.set(null);

    try {
      const data = await firstValueFrom(
        this.analyticsService.getProductionPeriodAnalytics(this.startDate(), this.endDate()),
      );
      this.productionPeriodAnalytics.set(data);
    } catch (error) {
      this.productionPeriodLoadError.set(this.extractErrorMessage(error));
    } finally {
      this.productionPeriodLoading.set(false);
    }
  }

  private async loadProducts(): Promise<void> {
    this.productsLoading.set(true);
    this.productsLoadError.set(null);

    try {
      const products = await firstValueFrom(this.productService.getAllProducts());
      this.products.set(products);
    } catch {
      this.productsLoadError.set('Impossible de charger le stock actuel.');
    } finally {
      this.productsLoading.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Impossible de charger les données pour cette période.';
  }

  private chartTheme(): ChartTheme {
    const styles = getComputedStyle(document.documentElement);
    const read = (token: string, fallback: string) =>
      styles.getPropertyValue(token).trim() || fallback;

    return {
      accent: read('--gz-accent-400', '#e6a68c'),
      sage: read('--gz-sage-300', '#c3caa3'),
      textSecondary: read('--gz-text-secondary', '#a9a6a0'),
      textPrimary: read('--gz-text-primary', '#f6f4f0'),
      gridline: read('--gz-border-soft', '#201f1c'),
      surface: read('--gz-surface', '#161513'),
    };
  }

  private tooltipBase(theme: ChartTheme) {
    return {
      backgroundColor: theme.surface,
      titleColor: theme.textSecondary,
      bodyColor: theme.textPrimary,
      borderColor: theme.gridline,
      borderWidth: 1,
      padding: 10,
    };
  }

  private renderStatusChart(canvas: HTMLCanvasElement, counts: StatusCount[]): void {
    const theme = this.chartTheme();
    const labels = counts.map((count) => count.label);
    const values = counts.map((count) => count.count);

    if (this.statusChart) {
      this.statusChart.data.labels = labels;
      this.statusChart.data.datasets[0].data = values;
      this.statusChart.update();
      return;
    }

    this.statusChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: theme.accent,
            borderRadius: 4,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = context.parsed.x;
                return ` ${value} commande${value === 1 ? '' : 's'}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
          y: {
            ticks: { color: theme.textSecondary },
            grid: { display: false },
          },
        },
      },
    });
  }

  private renderRevenueChart(canvas: HTMLCanvasElement, labels: string[], values: number[]): void {
    const theme = this.chartTheme();

    if (this.revenueChart) {
      this.revenueChart.data.labels = labels;
      this.revenueChart.data.datasets[0].data = values;
      this.revenueChart.update();
      return;
    }

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: theme.accent,
            backgroundColor: withOpacity(theme.accent, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: theme.accent,
            pointBorderColor: theme.surface,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'line'>) =>
                ` ${this.currencyService.format(context.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary, precision: 0 },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  private renderOrdersChart(canvas: HTMLCanvasElement, labels: string[], values: number[]): void {
    const theme = this.chartTheme();

    if (this.ordersChart) {
      this.ordersChart.data.labels = labels;
      this.ordersChart.data.datasets[0].data = values;
      this.ordersChart.update();
      return;
    }

    this.ordersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: theme.accent,
            borderRadius: 4,
            maxBarThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = context.parsed.y;
                return ` ${value} commande${value === 1 ? '' : 's'}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary, precision: 0 },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  private renderCustomersChart(canvas: HTMLCanvasElement, labels: string[], values: number[]): void {
    const theme = this.chartTheme();

    if (this.customersChart) {
      this.customersChart.data.labels = labels;
      this.customersChart.data.datasets[0].data = values;
      this.customersChart.update();
      return;
    }

    this.customersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: theme.sage,
            borderRadius: 4,
            maxBarThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = context.parsed.y;
                return ` ${value} nouveau${value === 1 ? '' : 'x'} client${value === 1 ? '' : 's'}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary, precision: 0 },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  private renderGyozaChart(
    canvas: HTMLCanvasElement,
    days: AnalyticsTimeSeries['days'],
  ): void {
    const theme = this.chartTheme();
    const selected = this.selectedProduct();
    const names = selected === ALL_PRODUCTS ? this.productNames() : [selected];
    const stacked = selected === ALL_PRODUCTS && names.length > 1;

    const datasets = names.map((name) => ({
      label: name,
      data: days.map((day) => day.unitsByProduct[name] ?? 0),
      backgroundColor: this.colorFor(name),
      borderRadius: stacked ? 0 : 4,
      maxBarThickness: 20,
      stack: 'units',
    }));

    // Recreated (not updated in place) because switching product filters also
    // flips stacking mode on/off, which Chart.js doesn't support toggling live.
    this.gyozaChart?.destroy();

    this.gyozaChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: this.dayLabels(), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: stacked,
            position: 'top',
            align: 'end',
            labels: { color: theme.textSecondary, boxWidth: 12, boxHeight: 12 },
          },
          tooltip: {
            ...this.tooltipBase(theme),
            callbacks: {
              label: (context: TooltipItem<'bar'>) =>
                ` ${context.dataset.label}: ${context.parsed.y} gyoza${context.parsed.y === 1 ? '' : 's'}`,
            },
          },
        },
        scales: {
          x: {
            stacked,
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            stacked,
            beginAtZero: true,
            ticks: { color: theme.textSecondary, precision: 0 },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  private renderSessionCostChart(canvas: HTMLCanvasElement, sessions: ProductionAnalytics['sessions']): void {
    const theme = this.chartTheme();
    const labels = sessions.map((session) => session.batchNumber);
    const values = sessions.map((session) => session.materialCost);

    if (this.sessionCostChart) {
      this.sessionCostChart.data.labels = labels;
      this.sessionCostChart.data.datasets[0].data = values;
      this.sessionCostChart.update();
      return;
    }

    this.sessionCostChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: theme.accent,
            borderRadius: 4,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => ` ${this.currencyService.format(context.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  private renderFlavorCostChart(
    canvas: HTMLCanvasElement,
    flavorNames: string[],
    averageCostPerGyozaByFlavor: Record<string, number>,
  ): void {
    const theme = this.chartTheme();
    const values = flavorNames.map((name) => averageCostPerGyozaByFlavor[name] ?? 0);
    const colors = flavorNames.map((_, index) => this.flavorColorFor(index));

    if (this.flavorCostChart) {
      this.flavorCostChart.data.labels = flavorNames;
      this.flavorCostChart.data.datasets[0].data = values;
      this.flavorCostChart.data.datasets[0].backgroundColor = colors;
      this.flavorCostChart.update();
      return;
    }

    this.flavorCostChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: flavorNames,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => ` ${this.currencyService.format(context.parsed.x ?? 0)}/gyoza`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
          y: {
            ticks: { color: theme.textSecondary },
            grid: { display: false },
          },
        },
      },
    });
  }
  private renderPeriodHourlyRevenueChart(
    canvas: HTMLCanvasElement,
    sessions: ProductionPeriodAnalytics['sessions'],
  ): void {
    const theme = this.chartTheme();
    const labels = sessions.map((session) => session.batchNumber);
    const values = sessions.map((session) => session.hourlyRevenue);

    if (this.periodHourlyRevenueChart) {
      this.periodHourlyRevenueChart.data.labels = labels;
      this.periodHourlyRevenueChart.data.datasets[0].data = values;
      this.periodHourlyRevenueChart.update();
      return;
    }

    this.periodHourlyRevenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: theme.accent,
            backgroundColor: withOpacity(theme.accent, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: theme.accent,
            pointBorderColor: theme.surface,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'line'>) =>
                ` ${this.currencyService.format(context.parsed.y ?? 0)}/h`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            ticks: { color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
        },
      },
    });
  }

  /** Bars share the left axis (money/session); material cost/gyoza gets its own right axis
   *  since it's a much smaller figure and would otherwise flatten to invisible. */
  private renderPeriodProfitChart(canvas: HTMLCanvasElement, sessions: ProductionPeriodAnalytics['sessions']): void {
    const theme = this.chartTheme();
    const labels = sessions.map((session) => session.batchNumber);
    const materialCostValues = sessions.map((session) => session.materialCostPerGyoza);
    const grossValues = sessions.map((session) => session.grossProfit);
    const netValues = sessions.map((session) => session.netProfit);

    if (this.periodProfitChart) {
      this.periodProfitChart.data.labels = labels;
      this.periodProfitChart.data.datasets[0].data = materialCostValues;
      this.periodProfitChart.data.datasets[1].data = grossValues;
      this.periodProfitChart.data.datasets[2].data = netValues;
      this.periodProfitChart.update();
      return;
    }

    this.periodProfitChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Coût matière / gyoza',
            data: materialCostValues,
            backgroundColor: theme.textSecondary,
            borderRadius: 4,
            maxBarThickness: 14,
            yAxisID: 'y1',
          },
          {
            label: 'Bénéfice brut',
            data: grossValues,
            backgroundColor: theme.accent,
            borderRadius: 4,
            maxBarThickness: 14,
            yAxisID: 'y',
          },
          {
            label: 'Bénéfice net',
            data: netValues,
            backgroundColor: theme.sage,
            borderRadius: 4,
            maxBarThickness: 14,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { color: theme.textSecondary, boxWidth: 12, boxHeight: 12 },
          },
          tooltip: {
            ...this.tooltipBase(theme),
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const suffix = context.dataset.yAxisID === 'y1' ? '/gyoza' : '';
                return ` ${context.dataset.label}: ${this.currencyService.format(context.parsed.y ?? 0)}${suffix}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.textSecondary, autoSkip: true, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
          y1: {
            type: 'linear',
            position: 'right',
            ticks: { color: theme.textSecondary },
            grid: { display: false },
          },
        },
      },
    });
  }

  private renderParticipantHoursChart(canvas: HTMLCanvasElement, participantHours: ParticipantHours[]): void {
    const theme = this.chartTheme();
    const labels = participantHours.map((entry) => entry.participantName);
    const values = participantHours.map((entry) => entry.hours);

    if (this.participantHoursChart) {
      this.participantHoursChart.data.labels = labels;
      this.participantHoursChart.data.datasets[0].data = values;
      this.participantHoursChart.update();
      return;
    }

    this.participantHoursChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: theme.sage,
            borderRadius: 4,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => ` ${context.parsed.x} h`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary },
            grid: { color: theme.gridline },
          },
          y: {
            ticks: { color: theme.textSecondary },
            grid: { display: false },
          },
        },
      },
    });
  }

  private renderStockByFlavorChart(canvas: HTMLCanvasElement, products: Product[]): void {
    const theme = this.chartTheme();
    const labels = products.map((product) => product.name);
    const values = products.map((product) => product.stockQuantity);
    const colors = products.map((_, index) => this.flavorColorFor(index));

    if (this.stockByFlavorChart) {
      this.stockByFlavorChart.data.labels = labels;
      this.stockByFlavorChart.data.datasets[0].data = values;
      this.stockByFlavorChart.data.datasets[0].backgroundColor = colors;
      this.stockByFlavorChart.update();
      return;
    }

    this.stockByFlavorChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderRadius: 4,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipBase(theme),
            displayColors: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) =>
                ` ${context.parsed.x} gyoza${context.parsed.x === 1 ? '' : 's'} en stock`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: theme.textSecondary, precision: 0 },
            grid: { color: theme.gridline },
          },
          y: {
            ticks: { color: theme.textSecondary },
            grid: { display: false },
          },
        },
      },
    });
  }
}

function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
