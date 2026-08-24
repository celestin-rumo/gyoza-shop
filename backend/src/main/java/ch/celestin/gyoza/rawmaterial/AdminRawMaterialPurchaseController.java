package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialPurchaseRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialPurchaseResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/raw-material-purchases")
public class AdminRawMaterialPurchaseController {

    private final RawMaterialPurchaseService rawMaterialPurchaseService;

    public AdminRawMaterialPurchaseController(RawMaterialPurchaseService rawMaterialPurchaseService) {
        this.rawMaterialPurchaseService = rawMaterialPurchaseService;
    }

    @GetMapping
    public List<RawMaterialPurchaseResponse> getPurchases(
            @RequestParam(required = false) Long rawMaterialId
    ) {
        return rawMaterialPurchaseService.getPurchases(rawMaterialId);
    }

    @PostMapping
    public RawMaterialPurchaseResponse createPurchase(
            @Valid @RequestBody CreateRawMaterialPurchaseRequest request
    ) {
        return rawMaterialPurchaseService.createPurchase(request);
    }
}
