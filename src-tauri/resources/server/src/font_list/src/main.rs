use font_kit::source::SystemSource;

fn get_fonts() -> Vec<String> {
    let source = SystemSource::new();
    let families = source.all_families().unwrap_or(Vec::new());
    families.into_iter().collect()
}

fn main() {
    for font in get_fonts() {
        println!("{}", font);
    }
}
