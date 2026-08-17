package ch.celestin.gyoza.pack;

import ch.celestin.gyoza.pack.dto.CreatePackRequest;
import ch.celestin.gyoza.pack.dto.PackResponse;
import ch.celestin.gyoza.pack.dto.UpdatePackRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminPackController {

    private final PackOptionService packOptionService;

    public AdminPackController(PackOptionService packOptionService) {
        this.packOptionService = packOptionService;
    }

    @PostMapping("/products/{productId}/packs")
    public PackResponse addPack(
            @PathVariable Long productId,
            @Valid @RequestBody CreatePackRequest request
    ) {
        return packOptionService.addPack(productId, request);
    }

    @PutMapping("/packs/{packId}")
    public PackResponse updatePack(
            @PathVariable Long packId,
            @Valid @RequestBody UpdatePackRequest request
    ) {
        return packOptionService.updatePack(packId, request);
    }

    @DeleteMapping("/packs/{packId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePack(@PathVariable Long packId) {
        packOptionService.deletePack(packId);
    }
}
