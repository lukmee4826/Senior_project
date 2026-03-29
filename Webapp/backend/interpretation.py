import models

def calculate_interpretation(diameter: float, bp: models.BreakpointDiskDiffusion) -> str:
    # Logic: R <= resistant_max, S >= susceptible_min
    # Prioritize R, then S, then I?
    
    # 1. Check Resistant
    if bp.resistant_max_mm is not None and diameter <= bp.resistant_max_mm:
        return "R"
    
    # 2. Check Susceptible
    if bp.susceptible_min_mm is not None and diameter >= bp.susceptible_min_mm:
        return "S"
        
    # 3. Check Intermediate
    # Explicit range check or exclusion?
    # If not R and not S, and strictly between?
    if bp.intermediate_min_mm is not None and bp.intermediate_max_mm is not None:
         if bp.intermediate_min_mm <= diameter <= bp.intermediate_max_mm:
             return "I"
             
    # Fallback for implicit Intermediate (between R and S)
    if bp.resistant_max_mm is not None and bp.susceptible_min_mm is not None:
        if bp.resistant_max_mm < diameter < bp.susceptible_min_mm:
            return "I"

    return "Unknown"
