package ch.celestin.gyoza.analytics.dto;

/** Packs sold of one size (e.g. 6, 12) over a period, regardless of flavor. */
public record PackSalesPoint(
        int packSize,
        int totalPacksSold,
        int totalUnits
) {
}
