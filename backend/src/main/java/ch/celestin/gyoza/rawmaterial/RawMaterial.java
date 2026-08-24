package ch.celestin.gyoza.rawmaterial;

import jakarta.persistence.*;

@Entity
@Table(name = "raw_materials")
public class RawMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String unit;

    protected RawMaterial() {
    }

    public RawMaterial(String name, String unit) {
        this.name = name;
        this.unit = unit;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getUnit() {
        return unit;
    }

    public void rename(String newName) {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException(
                    "Le nom ne peut pas être vide"
            );
        }

        this.name = newName;
    }

    public void changeUnit(String newUnit) {
        if (newUnit == null || newUnit.isBlank()) {
            throw new IllegalArgumentException(
                    "L'unité ne peut pas être vide"
            );
        }

        this.unit = newUnit;
    }
}
