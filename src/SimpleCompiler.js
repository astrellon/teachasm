;(function()
{
    function SimpleCompiler()
    {
        this.ast = new window.simpleAst();
        this.variables = {};
    }
    var fn = SimpleCompiler.prototype;

    fn.create = function()
    {
        var sast = window.simpleAst;
        var value = new sast.immediateValue('int', 5);
        var declare = new sast.declareVar('', 'x', 'int');
        var setVar = new sast.getVar('', 'x');
        var assign = new sast.assign(declare, setVar);

        this.ast.rootNodes.push(declare);
        this.ast.rootNodes.push(assign);
    
    }

    fn.getVariable = function(fullname)
    {
        var result = this.variables[fullname];
        if (!result)
        {
            result = this.variables[fullname] = new Variable(fullname);
        }
        return result;
    }

    fn.compile = function()
    {
        
    }

    var inMemoryPos = 'inMemory';
    var inRegisterPos = 'inRegister';
    function Variable(fullname)
    {
        this.fullname = fullname;
        this.position = inMemoryPos;
    }

    window.simpleCompiler = Compiler;

})();
