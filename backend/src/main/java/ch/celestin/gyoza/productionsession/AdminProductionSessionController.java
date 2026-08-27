package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.productionsession.dto.CreateProductionSessionRequest;
import ch.celestin.gyoza.productionsession.dto.ProductionSessionResponse;
import ch.celestin.gyoza.productionsession.dto.UpdateOtherCostsRequest;
import ch.celestin.gyoza.productionsession.dto.UpdateProductionSessionRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/production-sessions")
public class AdminProductionSessionController {

    private final ProductionSessionService productionSessionService;

    public AdminProductionSessionController(ProductionSessionService productionSessionService) {
        this.productionSessionService = productionSessionService;
    }

    @GetMapping
    public List<ProductionSessionResponse> getAllSessions() {
        return productionSessionService.getAllSessions();
    }

    @GetMapping("/{id}")
    public ProductionSessionResponse getSession(@PathVariable Long id) {
        return productionSessionService.getSession(id);
    }

    @PostMapping
    public ProductionSessionResponse createSession(@Valid @RequestBody CreateProductionSessionRequest request) {
        return productionSessionService.createSession(request);
    }

    @PatchMapping("/{id}/other-costs")
    public ProductionSessionResponse updateOtherCosts(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOtherCostsRequest request
    ) {
        return productionSessionService.updateOtherCosts(id, request.otherCosts());
    }

    @PutMapping("/{id}")
    public ProductionSessionResponse updateSession(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductionSessionRequest request
    ) {
        return productionSessionService.updateSession(id, request);
    }
}
