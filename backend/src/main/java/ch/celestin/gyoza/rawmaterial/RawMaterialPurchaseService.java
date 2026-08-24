package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialPurchaseRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialPurchaseResponse;

import java.util.List;

public interface RawMaterialPurchaseService {

    List<RawMaterialPurchaseResponse> getPurchases(Long rawMaterialId);

    RawMaterialPurchaseResponse createPurchase(CreateRawMaterialPurchaseRequest request);
}
