package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialResponse;
import ch.celestin.gyoza.rawmaterial.dto.UpdateRawMaterialRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/raw-materials")
public class AdminRawMaterialController {

    private final RawMaterialService rawMaterialService;

    public AdminRawMaterialController(RawMaterialService rawMaterialService) {
        this.rawMaterialService = rawMaterialService;
    }

    @GetMapping
    public List<RawMaterialResponse> getAllRawMaterials() {
        return rawMaterialService.getAllRawMaterials();
    }

    @PostMapping
    public RawMaterialResponse createRawMaterial(@Valid @RequestBody CreateRawMaterialRequest request) {
        return rawMaterialService.createRawMaterial(request);
    }

    @PutMapping("/{rawMaterialId}")
    public RawMaterialResponse updateRawMaterial(
            @PathVariable Long rawMaterialId,
            @Valid @RequestBody UpdateRawMaterialRequest request
    ) {
        return rawMaterialService.updateRawMaterial(rawMaterialId, request);
    }

    @DeleteMapping("/{rawMaterialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRawMaterial(@PathVariable Long rawMaterialId) {
        rawMaterialService.deleteRawMaterial(rawMaterialId);
    }
}
