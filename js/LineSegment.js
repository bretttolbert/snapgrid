function LineSegment(Ax,Ay,Bx,By) 
{
    this.p1 = {x:Ax, y:Ay};
    this.p2 = {x:Bx, y:By};
    this.selected = false;
    this.hover = false;
    this.repr = function() {
        return '{p1:{x:' + this.p1.x + ',y:' + this.p1.y + '},p2:{x:' + this.p2.x + ',y:' + this.p2.y + '}';
    }
}