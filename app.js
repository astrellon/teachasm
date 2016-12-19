;(function()
{
    'use strict';

    let cpu = null;

    function init()
    {
        simpleCpuAssembler.init();
        
        cpu = new simpleCpu();
        cpu.init(1024, 8);

        $('.js-texteditor').on('change', onTextChange);

        let initialText = localStorage.getItem('textEditor');
        console.log('Initial:', initialText);
        if (initialText)
        {
            document.querySelector('.js-texteditor').value = initialText;
        }

        $('.js-run').on('click', onRunClick);
        $('.js-assemble').on('click', onAssembleClick);
        $('.js-one-step').on('click', onOneStepClick);
        $('.js-reset').on('click', onResetClick);

        let $testText = $('.js-input');
        let width = $testText.width();
        let height = $testText.height();
        console.log('Size: ', width, height);
        $testText.removeClass('test-text');
    }

    function onTextChange(e)
    {
        localStorage.setItem('textEditor', e.target.value);
    }

    function onAssembleClick()
    {
        let assembler = new simpleCpuAssembler();
        let code = document.querySelector('.js-texteditor').value;
        let instructions = assembler.assemble(code);

        cpu.setInstructions(instructions);
        $('.js-input').html(getInputDisplay());
    }

    function onRunClick()
    {
        cpu.execute();
        updateDisplay();
    }

    function onOneStepClick()
    {
        cpu.oneStep();
        updateDisplay();
    }

    function onResetClick()
    {
        cpu.reset();
        updateDisplay();
    }

    function updateDisplay()
    {
        $('.js-registers').html(getRegisterDisplay());
        $('.js-input').html(getInputDisplay());
        $('.js-program-counter').text(cpu.getProgramCounter());
    }

    function getInputDisplay()
    {
        let input = cpu.getInstructions();
        let result = '';
        let pc = cpu.getProgramCounter();

        let start = Math.max(pc - 10, 0);
        let end = Math.min(pc + 10, input.length);
        for (let i = start; i < end; i++)
        {
            result += i + ': ' + formatHex(input[i]);
            if (i === pc)
            {
                result += ' <-- PC';
            }
            result += '<br/>';
        }
        if (pc >= input.length)
        {
            result += '<-- PC at end';
        }
        return result;
    }

    function formatHex(input)
    {
        if (input < 16)
        {
            return '0' + input.toString(16);
        }
        return input.toString(16);
    }

    function getRegisterDisplay()
    {
        let registers = cpu.registers;
        let result = '';
        for (let i = 0; i < registers.length; i++)
        {
            result += i + ' = ' + registers[i] + '<br/>';
        }
        return result;
    }

    $(init);

})();
