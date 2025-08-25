from PIL import Image, ImageDraw

def make_icons():
    sizes = [128, 48, 16]
    for size in sizes:
        img = Image.new('RGBA', (size, size), '#121212')
        draw = ImageDraw.Draw(img)
        rect_w = size * 0.25
        rect_h = size * 0.4
        draw.rectangle([size*0.1, size*0.3, size*0.1+rect_w, size*0.3+rect_h], fill='white')
        tri = [
            (size*0.1+rect_w, size*0.3),
            (size*0.1+rect_w, size*0.3+rect_h),
            (size*0.1+rect_w+rect_h*0.8, size*0.5)
        ]
        draw.polygon(tri, fill='white')
        cx = size*0.1+rect_w+rect_h*0.8
        cy = size*0.5
        for f in [0.8, 1.1, 1.4]:
            r = rect_h * f
            draw.arc([cx-r, cy-r, cx+r, cy+r], start=-40, end=40, fill='white', width=max(1, int(size*0.05)))
        img.save(f'icons/icon{size}.png')

if __name__ == '__main__':
    make_icons()
