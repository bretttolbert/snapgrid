function LineSegment(Ax,Ay,Bx,By) 
{
    this.p1 = {x:0, y:0};
    this.p2 = {x:0, y:0};
    if (Ax !== undefined) this.p1.x = Ax;
    if (Ay !== undefined) this.p1.y = Ay;
    if (Bx !== undefined) this.p2.x = Bx;
    if (By !== undefined) this.p2.y = By;
    this.selected = false;
    this.hover = false;
    
    this.repr = function() {
        return '{p1:{x:' + this.p1.x + ',y:' + this.p1.y + '},p2:{x:' + this.p2.x + ',y:' + this.p2.y + '}}';
    }
    
    this.setData = function(Ax,Ay,Bx,By) {
        this.p1.x = Ax;
        this.p1.y = Ay;
        this.p2.x = Bx;
        this.p2.y = By;
    }
    
    this.clone = function() {
        var result = new LineSegment();
        result.setData(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
        return result;
    }
}